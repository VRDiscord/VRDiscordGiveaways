import { Collection, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "getkey"
        this.regex = /getkey/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let check = await ctx.sql.query(`SELECT * FROM freekeys WHERE id='${ctx.interaction.message.id}' AND user_id='${ctx.interaction.user.id}' LIMIT 1`)
        if(check.rowCount) return ctx.reply({content: `You already got a key: \`${check.rows[0].prize}\``, ephemeral: true})
        let prize = await ctx.sql.query(`SELECT * FROM freekeys WHERE id='${ctx.interaction.message.id}' AND user_id IS NULL LIMIT 1`)
        if(!prize.rowCount) return ctx.error("All keys have been handed out already")
        await ctx.sql.query(`UPDATE freekeys SET user_id='${ctx.interaction.user.id}' WHERE prize=$1 AND id='${ctx.interaction.message.id}'`, [prize.rows[0].prize])

        ctx.reply({content: `Here's a key: \`${prize.rows[0].prize}\``, ephemeral: true})
    }
}
