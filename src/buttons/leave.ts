import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";
import { syncDB } from "../intervals/syncdb";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "leave"
        this.regex = /leave_\d{17,20}/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let user_id = ctx.interaction.user.id
        let id = ctx.interaction.customId.split("_")[1]!
        if(!ctx.client.giveawayCache.has(id)) return ctx.error("Unable to find giveaway")
        ctx.client.giveawayCache.set(id, ctx.client.giveawayCache.get(id)!.filter(u => u !== user_id))
        syncDB(ctx.sql, ctx.client)
        return ctx.interaction.update({
            content: `You left the giveaway.`,
            components: []
        })
    }
}
