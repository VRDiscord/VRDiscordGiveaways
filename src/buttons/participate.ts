import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "participate"
        this.regex = /participate/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        if(!ctx.client.giveawayCache.get(ctx.interaction.message.id)) {
            let users = await ctx.sql.query(`SELECT * FROM giveaways WHERE id='${ctx.interaction.message.id}' AND NOT rolled`).then(res => res?.rows[0].users)
            if(users) ctx.client.giveawayCache.set(ctx.interaction.message.id, users)
        } 
        if(!ctx.client.giveawayCache.get(ctx.interaction.message.id)) return ctx.error("This giveaway has ended")
        if(ctx.client.blacklisted.includes(ctx.interaction.user.id)) return ctx.error("You have been blacklisted from giveaways")
        if(ctx.client.giveawayCache.get(ctx.interaction.message.id)?.includes(ctx.interaction.member?.user.id ?? "")) return ctx.error("You are already a participant")
        ctx.client.giveawayCache.set(ctx.interaction.message.id, [...ctx.client.giveawayCache.get(ctx.interaction.message.id)!, ctx.member!.id])
        ctx.reply({content: "You are now a participant of this giveaway", ephemeral: true})
    }
}
