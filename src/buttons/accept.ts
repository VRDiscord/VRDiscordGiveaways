import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "accept"
        this.regex = /accept_\d{17,20}/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let prize = await ctx.sql.query(`DELETE FROM prizes WHERE user_id='${ctx.interaction.user.id}' AND id='${ctx.customId.split("_")[1]}' RETURNING *`)

        if(!prize.rows.length) return ctx.update({content: "Your prize has been auto rerolled due to inactivity or the hand out process has been stopped", components: [], embeds: []})

        const giveaway = await ctx.sql.query("SELECT * FROM giveaways WHERE id=$1", [ctx.customId.split("_")[1]]).then(res => res.rows[0]).catch(console.error)
        ctx.update({content: `Here's your prize: ${prize.rows[0].prize}`, components: [], embeds: []})
        ctx.log(`${ctx.interaction.user.username} (\`${ctx.interaction.user.id}\`) received prize \`${prize.rows[0].prize}\` from giveaway "${giveaway.name || giveaway.id}" \`${giveaway.id}\``, [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}`}]}])
        await ctx.sql.query("UPDATE giveaways SET won_users=ARRAY_APPEND(ARRAY_REMOVE(won_users, $1), $1) WHERE id=$2", [ctx.interaction.user.id, prize.rows[0].id])
        const keys = await ctx.sql.query(`SELECT * FROM prizes WHERE id=$1`, [ctx.customId.split("_")[1]])
        if(!keys.rows.length) ctx.client.log(`Giveaway "${giveaway.name}" \`${giveaway.id}\` ended all keys have been handed out`)
    }
}
