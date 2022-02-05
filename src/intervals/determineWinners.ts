import { GiveawayClient } from "../classes/client";
import pg from "pg"
import { Message, MessageEmbed, NewsChannel, TextChannel } from "discord.js";

export async function determineWinner(sql: pg.Client, client: GiveawayClient){
    let expired =  await sql.query(`SELECT * FROM giveaways WHERE duration <= ${Date.now()}`)

    for(let giveaway of expired.rows) {
        let users = giveaway.users as string[]
        if(!users.length) {
            client.log(`Giveaway \`${giveaway.id}\` ended with no entries`)
            await sql.query(`DELETE FROM giveaways WHERE id='${giveaway.id}'`)
            return
        }
        await sql.query(`DELETE FROM giveaways WHERE id='${giveaway.id}'`)
        const winners = users.sort(() => Math.random() > 0.5 ? 1 : -1).splice(0, giveaway.winners)
        let channel = await client.channels.fetch(giveaway.channel_id).catch(() => null)
        let message: Message | undefined
        console.log(channel)
        if(channel instanceof TextChannel || channel instanceof NewsChannel) {
            message = await channel.messages.fetch(giveaway.id).catch(() => undefined)

            let newembed = new MessageEmbed(message?.embeds[0])
            .setColor("RED")
            message?.edit({embeds: [newembed], components: []})
            message?.reply({content: `**Giveaway ended. Winners:**\n\n${winners.map(w => `<@${w}>`).join(", ")}`}).catch(() => null)
        }

        let dms_closed: string[] = []
        let newwinners: string[] = []
        let oneprize = giveaway.prize.length !== giveaway.winners

        let keys =  await sql.query(`SELECT * FROM prizes WHERE id='${giveaway.id}'`)
        sql.query(`DELETE FROM prizes WHERE id='${giveaway.id}'`)
        let prizes = await sql.query(`INSERT INTO prizes VALUES ${keys.rows.map((p, i) => `(DEFAULT, '${giveaway.id}', '${p.prize}', '${winners[i]}') RETURNING *`).join(", ")}`)

        let embed = new MessageEmbed()
        .setTitle("🎉 You Won 🎉")
        .setDescription(`You won in [this giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}}/${giveaway.channel_id}/${giveaway.id}). Do you want to accept your prize?`)

        let buttons = [{
            type: 1,
            components: [{
                type: 2,
                custom_id: "accept",
                label: "Accept",
                style: 3
            },{
                type: 2,
                custom_id: "deny",
                label: "Deny",
                style: 4
            }]
        }]


        winners.forEach(async w => {
            let user = await client.users.fetch(w).catch(() => null)
            if(!user) return
            user.send({embeds: [embed], components: buttons}).catch(() => null)
            // TODO what if dms are closed
        })

    }
}