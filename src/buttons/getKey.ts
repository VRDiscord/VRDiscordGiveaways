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
        let prize = await ctx.sql.query(`DELETE TOP(1) FROM prizes WHERE id='${ctx.interaction.message.id}' AND NOT user_id RETURNING *`)
        if(!prize.rowCount) return ctx.error("All keys have been handed out already")
        ctx.reply({content: `Here's a key: ${prize.rows[0].prize}`})
    }
}
