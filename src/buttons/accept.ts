import { Collection, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";



export default class Test extends Button {
    constructor() {
        super()
        this.name = "accept"
        this.regex = /accept/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        if(!ctx.client.giveawayCache.get(ctx.interaction.message.id)) {
            let users = await ctx.sql.query(`SELECT * FROM giveaways WHERE id='${ctx.interaction.message.id}'`).then(res => res?.rows[0].users)
            if(users) ctx.client.giveawayCache.set(ctx.interaction.message.id, users)
        } 
        if(!ctx.client.giveawayCache.get(ctx.interaction.message.id)) return ctx.error("This giveaway has ended")
        if(ctx.client.giveawayCache.get(ctx.interaction.message.id)?.includes(ctx.interaction.member?.user.id ?? "")) return ctx.error("You are already a participant")
        ctx.client.giveawayCache.set(ctx.interaction.message.id, [...ctx.client.giveawayCache.get(ctx.interaction.message.id)!, ctx.member!.id])
        ctx.reply({content: "You are now a participant of this giveaway", ephemeral: true})
    }
}
