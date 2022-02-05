import { Collection, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "accept"
        this.regex = /accept_\d{17,19}/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let prize = await ctx.sql.query(`DELETE FROM prizes WHERE user_id='${ctx.interaction.user.id}' AND id='${ctx.customId.split("_")[1]}' RETURNING *`)
        ctx.update({content: `Here's your prize: ${prize.rows[0].prize}`, components: []})
    }
}
