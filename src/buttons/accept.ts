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
        if(!prize.rows.length) {
            return ctx.update({content: "Your prize has been auto rerolled due to inactivity or the hand out process has been stopped", components: [], embeds: []})
        }
        ctx.update({content: `Here's your prize: ${prize.rows[0].prize}`, components: [], embeds: []})
        ctx.log(`${ctx.interaction.user.tag} (\`${ctx.interaction.user.id}\`) received prize \`${prize.rows[0].prize}\` from giveaway \`${ctx.customId.split("_")[1]}\``)
        let giveaway = await ctx.sql.query(`SELECT * FROM giveaways WHERE id='${ctx.customId.split("_")[1]}'`)
        await ctx.sql.query("UPDATE giveaways SET won_users=$1", [`{${[...giveaway.rows[0].won_users, ctx.interaction.user.id].join(", ")}}`])
    }
}
