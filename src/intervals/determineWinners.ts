import { GiveawayClient } from "../classes/client";
import pg from "pg"
import { Message, AttachmentBuilder, EmbedBuilder, NewsChannel, TextChannel, Colors } from "discord.js";
import { randomizeArray } from "../classes/randomizer";
import { syncDB } from "./syncdb";

export async function determineWinner(sql: pg.Pool, client: GiveawayClient){
    let expired = await sql.query(`SELECT * FROM giveaways WHERE duration <= ${Date.now()} AND NOT rolled`)
    for(let giveaway of expired.rows) {
        let pending_users = await sql.query(`SELECT * FROM prizes WHERE user_id IS NOT NULL`)
        // filters out pending users for other giveaways
        let users = (giveaway.users as string[]).filter((u: string) => !giveaway.won_users.includes(u)).filter(r => !pending_users.rows.find(ro => ro.user_id === r))
        
        let channel = await client.channels.fetch(giveaway.channel_id).catch(() => null)
        let message: Message | undefined
        if(channel instanceof TextChannel || channel instanceof NewsChannel) {
            message = await channel.messages.fetch(giveaway.id).catch(() => undefined)

            let newembed = new EmbedBuilder(message?.embeds[0].data)
            .setColor(Colors.Red)
            message?.edit({embeds: [newembed], components: []})
            message?.reply({
                embeds: [{
                    title: "This Giveaway ended",
                    description: `Total entries: \`${giveaway.users.length}\`\n\nThe winners have been notified.\nWinners now have 24 hours to claim their prize.`,
                    color: Colors.Aqua,
                    footer: {text: `Winners with closed DMs have been rerolled.`}
                }]
            }).catch(() => null)
        }

        if(!users.length) {
            client.log(`Giveaway "${giveaway.name}" \`${giveaway.id}\` ended with no entries`)
            await sql.query(`UPDATE giveaways SET rolled=TRUE WHERE id='${giveaway.id}'`)
            return
        }
        await sql.query(`UPDATE giveaways SET rolled=TRUE WHERE id='${giveaway.id}'`)
        let winners = randomizeArray(users).splice(0, giveaway.winners)

        let dms_closed: string[] = []

        let keys = await sql.query(`DELETE FROM prizes WHERE id='${giveaway.id}' AND user_id IS NULL RETURNING *`)


        const values = winners.map((p, i) => `(DEFAULT, '${giveaway.id}', '${keys.rows[i]?.prize ?? keys.rows[0].prize}', '${p}', ${Date.now()})`)
        const editquery = `INSERT INTO prizes VALUES ${values.join(", ")} RETURNING *`
        let prizes = await sql.query(editquery)

        let left_over_keys = keys.rows.filter(r => !prizes.rows.find(ro => ro.prize === r.prize))
        

        if(left_over_keys.length) {

            let f = new AttachmentBuilder(Buffer.from(left_over_keys.map(r => r.prize).join("\n")), {name: `${giveaway.id}_keys.txt`})
            
            client.log(`Giveaway "${giveaway.name}" ended and not enough members entered so the left over keys are attached below.\n**ID** \`${giveaway.id}\``, [f], [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}`}]}])
        }

        const probability = giveaway.winners / giveaway.users.length * 10000


        let embed = new EmbedBuilder()
        .setTitle("🎉 You Won 🎉")
        .setColor(Colors.Yellow)
        .setDescription(`You won in [the giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}) "${giveaway.name}".\n**Prize** ${giveaway.prize_description}\nYour chance of winning was ≈${Math.floor(probability)/100}%.\nDo you want to accept your prize?`)
        .setFooter({text: "VR Discord Giveaways", iconURL: client.user?.displayAvatarURL()})

        let components = [{
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

        while(winners.length) {
            let id = winners.splice(0, 1)[0]
            let user = await client.users.fetch(id)
            let res = await user.send({embeds: [embed], components}).catch(() => null)
            if(!res) {
                if(users.length) {
                    let newid = users.splice(0, 1)[0]
                    winners.push(newid)
                    await sql.query(`UPDATE prizes SET user_id='${newid}' WHERE user_id='${id}'`)
                } else {
                    dms_closed.push(id)
                }
            }
        }


        if(!dms_closed.length) return;
        let q = `DELETE FROM prizes WHERE user_id IN (${dms_closed.map(u => `'${u}'`).join(", ")}) AND id='${giveaway.id}' RETURNING *`
        let left_over = await sql.query(q)

        let file = new AttachmentBuilder(Buffer.from(left_over.rows.map(r => r.prize).join("\n")), {name: `${giveaway.id}_keys.txt`})
        
        client.log(`Giveaway "${giveaway.name}" ended and not all keys could be handed out. Left over keys are attached below.\n**ID** \`${giveaway.id}\``, [file], [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}`}]}])
    }
}