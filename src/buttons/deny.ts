import { Collection, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from "discord.js";
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
        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id='${ctx.customId.split("_")[1]}'`)
        let alreadywon = await ctx.sql.query(`SELECT * FROM prizes WHERE id='${ctx.customId.split("_")[1]}'`)
        let users = giveaway.rows[0].users.filter((u: string) => alreadywon.rows[0].find((r: {user_id: string}) => r.user_id === u)).sort(() => Math.random() > 0.5 ? -1 : 1)
        if(!users.length) {

            ctx.update({content: `Thanks for participating`, components: []})
            //no users left to reroll
            return
        }
        let prize = await ctx.sql.query(`UPDATE prizes SET user_id='${users[0]}' WHERE user_id='${ctx.interaction.user.id}' AND id='${ctx.customId.split("_")[1]}' RETURNING *`)
        ctx.update({content: `The prize has been rerolled. Thanks for participating`, components: []})

        
        let embed = new MessageEmbed()
        .setTitle("🎉 You Won 🎉")
        .setDescription(`You won in [this giveaway](https://discord.com/channels/${process.env["GUILD_ID"]}}/${giveaway.rows[0].channel_id}/${giveaway.rows[0].id}). Do you want to accept your prize?`)

        let buttons = [{
            type: 1,
            components: [{
                type: 2,
                custom_id: `accept_${giveaway.rows[0].id}`,
                label: "Accept",
                style: 3
            },{
                type: 2,
                custom_id: `deny_${giveaway.rows[0].id}`,
                label: "Deny",
                style: 4
            }]
        }]

        let given_away = false
        while(!given_away) {
            let id = users.shift()
            let user = await ctx.client.users.fetch(id).catch(() => null)
            if(!user) return
            let res = await user.send({embeds: [embed], components: buttons}).catch(() => null)
            if(res) given_away = true
            if(!users.length) break //no user left to give away to
        }
    }
}
