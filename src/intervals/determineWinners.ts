import { GiveawayClient } from "../classes/client";
import pg from "pg"
import { Message, MessageAttachment, MessageEmbed, NewsChannel, TextChannel } from "discord.js";

export async function determineWinner(sql: pg.Client, client: GiveawayClient){
    let expired = await sql.query(`SELECT * FROM giveaways WHERE duration <= ${Date.now()}`)

    for(let giveaway of expired.rows) {
        let users = giveaway.users as string[]
        if(!users.length) {
            client.log(`Giveaway \`${giveaway.id}\` ended with no entries`)
            //await sql.query(`DELETE FROM giveaways WHERE id='${giveaway.id}'`)
            return
        }
        //await sql.query(`DELETE FROM giveaways WHERE id='${giveaway.id}'`)
        const winners = users.sort(() => Math.random() > 0.5 ? 1 : -1).splice(0, giveaway.winners)
        let channel = await client.channels.fetch(giveaway.channel_id).catch(() => null)
        let message: Message | undefined
        if(channel instanceof TextChannel || channel instanceof NewsChannel) {
            message = await channel.messages.fetch(giveaway.id).catch(() => undefined)

            let newembed = new MessageEmbed(message?.embeds[0])
            .setColor("RED")
            message?.edit({embeds: [newembed], components: []})
            message?.reply({content: `**Giveaway ended**\n\nWinners have been messaged. If dms were closed the prize has been rerolled.`}).catch(() => null)
        }

        let dms_closed: string[] = []
        let newwinners: string[] = []

        let keys = await sql.query(`DELETE FROM prizes WHERE id='${giveaway.id}' AND user_id IS NULL RETURNING *`)
        const values = winners.map((p, i) => `(DEFAULT, '${giveaway.id}', '${keys.rows[i]?.prize ?? keys.rows[0].prize}', '${p}')`)
        const editquery = `INSERT INTO prizes VALUES ${values.join(", ")} RETURNING *`

        let prizes = await sql.query(editquery)

        let left_over_keys = keys.rows.filter(r => !prizes.rows.find(ro => ro.prize === r.prize))
        

        let res = new MessageEmbed()
        .setColor("AQUA")
        .setTitle("Giveaway ended. Not enough participants. Left over keys attached below")

        let f = new MessageAttachment(Buffer.from(left_over_keys.map(r => r.prize).join("\n")), `${giveaway.id}_keys.txt`)
        
        client.log(res, [f])


        let embed = new MessageEmbed()
        .setTitle("🎉 You Won 🎉")
        .setDescription(`You won in [this giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}). Do you want to accept your prize?`)

        let buttons = [{
            type: 1,
            components: [{
                type: 2,
                custom_id: `accept_${giveaway.id}`,
                label: "Accept",
                style: 3
            },{
                type: 2,
                custom_id: `deny_${giveaway.id}`,
                label: "Deny",
                style: 4
            }]
        }]

        winners.forEach(async w => {
            let user = await client.users.fetch(w).catch(() => null)
            if(!user) return
            let res = await user.send({embeds: [embed], components: buttons}).catch(() => null)
            if(!res && users.length) {
                dms_closed.push(w)
            }
            if(res) newwinners.push(w)
        })

        while(dms_closed.length) {
            if(!users) {dms_closed = []; return}
            let id = users.shift()!
            let user = await client.users.fetch(id).catch(() => null)
            if(!user) return
            let res = await user.send({embeds: [embed], components: buttons}).catch(() => null)
            // TODO what if dms are closed
            if(!res && users.length) {
                dms_closed.push(id)
            }
            let gotfrom = dms_closed.shift()
            if(res) newwinners.push(id)
            await sql.query(`UPDATE prizes SET user_id='${id}' WHERE user_id='${gotfrom}'`)
        }


        if(!dms_closed.length) return;
        let q = `DELETE FROM prizes WHERE user_id IN (${dms_closed.map(u => `'${u}'`).join(", ")}) RETURNING *`
        let left_over = await sql.query(q)
        // idfk what to do with it


        let result = new MessageEmbed()
        .setColor("AQUA")
        .setTitle("Giveaway ended. Leftover keys")

        let file = new MessageAttachment(Buffer.from(left_over.rows.map(r => r.prize).join("\n")), `${giveaway.id}_keys.txt`)
        
        client.log(result, [file])

    }
}