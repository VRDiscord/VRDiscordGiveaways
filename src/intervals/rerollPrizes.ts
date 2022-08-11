import { GiveawayClient } from "../classes/client";
import pg from "pg"
import { MessageEmbed } from "discord.js";

export async function rerollPrizes(sql: pg.Pool, client: GiveawayClient){
    let giveaways = await sql.query(`SELECT * FROM giveaways WHERE rolled`)
    let keys = await sql.query(`SELECT * FROM prizes WHERE (changed + ${1000*60*60*24}) <= ${Date.now()} AND user_id IS NOT NULL`)
    for(let key of keys.rows) {
        let user_id = key.user_id
        await client.users.fetch(user_id).then(u => u.send("Your prize has been auto rerolled due to inactivity")).catch(() => null)
        let giveaway = giveaways.rows.find(r => r.id === key.id)
        let users = giveaway.users.sort(() => Math.random() > 0.5 ? 1 : -1);
        let winners = users.splice(0, 1)
        await sql.query(`UPDATE prizes SET user_id='${winners[0]}', changed=${Date.now()} WHERE user_id='${key.user_id}'`)
        let dms_closed = []

        
        let embed = new MessageEmbed()
        .setTitle("🎉 You Won 🎉")
        .setDescription(`You won in [this giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}). Do you want to accept your prize?`)

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
            let uid = winners.splice(0, 1)[0]
            let user = await client.users.fetch(uid)
            let res = await user.send({embeds: [embed], components}).catch(() => null)
            if(!res) {
                if(users.length) {
                    let newid = users.splice(0, 1)[0]
                    winners.push(newid)
                    await sql.query(`UPDATE prizes SET user_id='${newid}' WHERE user_id='${uid}'`)
                } else {
                    dms_closed.push(uid)
                }
            }
        }

        if(dms_closed.length) {
            let q = `DELETE FROM prizes WHERE user_id IN (${dms_closed.map(u => `'${u}'`).join(", ")}) AND id='${giveaway.id}' RETURNING *`
            let left_over = await sql.query(q)
            
            client.log(`Auto rerolled prize (\`${left_over.rows[0].prize}\`) of \`${user_id}\` due to inactivity and no further winners could be determined.\n**GiveawayID** \`${giveaway.id}\``)
        }
    }
}