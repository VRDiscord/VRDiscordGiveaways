import { ButtonInteraction, GuildMember, InteractionDeferReplyOptions, InteractionDeferUpdateOptions, InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";
import { BaseContext } from "./baseContext";
import { GiveawayClient } from "./client";
import pg from "pg"

export class ButtonContext extends BaseContext{
    interaction: ButtonInteraction
    member?: GuildMember
    customId: string
    constructor(client: GiveawayClient, interaction: ButtonInteraction, member: GuildMember | undefined, sql: pg.Client){
        super(client, sql)
        this.interaction = interaction
        this.member = member
        this.customId = interaction.customId
    }

    async reply(options: (InteractionReplyOptions)) {
        return await this.interaction.reply(options)
    }

    async editReply(options: (InteractionReplyOptions)) {
        return await this.interaction.editReply(options)
    }

    async deferReply(options: (InteractionDeferReplyOptions)) {
        return await this.interaction.deferReply(options)
    }

    async followUp(options: (InteractionReplyOptions)) {
        return await this.interaction.followUp(options)
    }

    async update(options: (InteractionUpdateOptions)) {
        return await this.interaction.update(options)
    }

    async deferUpdate(options: (InteractionDeferUpdateOptions)) {
        return await this.interaction.deferUpdate(options)
    }

    error(error: string, data: {codeblock?: boolean, ephemeral?: boolean} = {codeblock: true, ephemeral: true}): null {
        if(!this.interaction.replied && !this.interaction.deferred) {
            this.interaction.reply({
                embeds: [
                    {
                        color: parseInt("0xED4245"),
                        description: `❌ **Error** | ${(data.codeblock ?? true) ? `\`${error}\`` : error}`
                    }
                ], ephemeral: data?.ephemeral ?? true
            });
            //who even needs the error message ¯\_(ツ)_/¯
            return null
        } else if (this.interaction.replied && !this.interaction.deferred) {
            this.interaction.editReply({
                embeds: [
                    {
                        color: parseInt("0xED4245"),
                        description: `❌ **Error** | ${(data.codeblock ?? true) ? `\`${error}\`` : error}`
                    }
                ]
            });
            return null
        }
        return null
    }
}