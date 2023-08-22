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
        let prizequery = await ctx.sql.query(`SELECT * FROM freekeys WHERE id='${ctx.interaction.message.id}' AND user_id IS NULL LIMIT 1`).catch(console.error)
        if(!prizequery?.rowCount) return ctx.error("All keys have been handed out already")
        const prize = prizequery.rows[0]!
        await ctx.sql.query(`UPDATE freekeys SET user_id='${ctx.interaction.user.id}' WHERE prize=$1 AND id='${ctx.interaction.message.id}'`, [prize.prize])

        ctx.log(`${ctx.interaction.user.username} (\`${ctx.interaction.user.id}\`) received key \`${prize.prize}\` from key handout \`${ctx.interaction.message.id}\``, [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${prize.channel_id}/${ctx.interaction.message.id}`}]}])
        ctx.reply({content: `Here's a key: \`${prize.prize}\``, ephemeral: true})
    }
}
