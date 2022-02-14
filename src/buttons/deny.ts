import { MessageEmbed, Snowflake} from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "deny"
        this.regex = /deny_\d{17,19}/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let id = ctx.customId.split("_")[1]
        if(!(ctx.client.confirmationcheck.get(id) ?? []).includes(ctx.interaction.user.id)) {
            let users = ctx.client.confirmationcheck.get(id) ?? []
            ctx.client.confirmationcheck.set(id, [...users, ctx.interaction.user.id])
            return ctx.reply({content: "Do you really want to deny your prize?\nTo deny press the button again", ephemeral: true})
        } else {
            let users = ctx.client.confirmationcheck.get(id) ?? []
            ctx.client.confirmationcheck.set(id, users.filter(u => u !== ctx.interaction.user.id))
        }
        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id='${id}'`)
        let key = await ctx.sql.query(`SELECT * FROM prizes WHERE id='${id}'`)
        if(!key.rows.length) {
            return ctx.update({content: "Your prize has been auto rerolled due to inactivity or the hand out process has been stopped", components: [], embeds: []})
        }
        let pending_users = await ctx.sql.query(`SELECT * FROM prizes WHERE user_id IS NOT NULL`)
        // filters out pending users for other giveaways
        let users = giveaway.rows[0].users.filter((u: string) => !key.rows.find(r => r.user_id === u)).filter((u: string) => !giveaway.rows[0].won_users.includes(u)).filter((r: Snowflake) => !pending_users.rows.find(ro => ro.user_id === r))

        ctx.update({embeds: [], components: [], content: `Thanks for participating.`})
        
        if(!users.length) {
            let q = `DELETE FROM prizes WHERE user_id='${ctx.interaction.user.id}' AND id='${id}' RETURNING *`
            let left_over = await ctx.sql.query(q)
            
            ctx.log(`${ctx.interaction.user.tag} (\`${ctx.interaction.user.id}\`) denied their prize (\`${left_over.rows[0].prize}\`) and no further winners could be determined.\n**GiveawayID** \`${id}\``)
            //give log not given away key
        } else {
            users = users.sort(() => Math.random() > 0.5 ? 1 : -1);
            let winners = users.splice(0, 1)
            await ctx.sql.query(`UPDATE prizes SET user_id='${winners[0]}', changed=${Date.now()} WHERE user_id='${ctx.interaction.user.id}'`)
            let dms_closed = []

            
            let embed = new MessageEmbed()
            .setTitle("🎉 You Won 🎉")
            .setDescription(`You won in [this giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.rows[0].channel_id}/${id}). Do you want to accept your prize?`)

            let components = [{
                type: 1,
                components: [{
                    type: 2,
                    custom_id: `accept_${id}`,
                    label: "Accept",
                    style: 3
                },{
                    type: 2,
                    custom_id: `deny_${id}`,
                    label: "Deny",
                    style: 4
                }]
            }]

            while(winners.length) {
                let uid = winners.splice(0, 1)[0]
                let user = await ctx.client.users.fetch(uid)
                let res = await user.send({embeds: [embed], components}).catch(() => null)
                if(!res) {
                    if(users.length) {
                        let newid = users.splice(0, 1)[0]
                        winners.push(newid)
                        await ctx.sql.query(`UPDATE prizes SET user_id='${newid}' WHERE user_id='${uid}'`)
                    } else {
                        dms_closed.push(uid)
                    }
                }
            }

            if(dms_closed.length) {
                let q = `DELETE FROM prizes WHERE user_id IN (${dms_closed.map(u => `'${u}'`).join(", ")}) AND id='${id}' RETURNING *`
                let left_over = await ctx.sql.query(q)
        
                ctx.log(`${ctx.interaction.user.tag} (\`${ctx.interaction.user.id}\`) denied their prize (\`${left_over.rows[0].prize}\`) and no further winners could be determined.\n**GiveawayID** \`${id}\``)
            }
        }
    }
}
