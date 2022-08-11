import { BaseCommandInteraction, Collection, CommandInteractionOption, GuildMember, InteractionDeferReplyOptions, InteractionReplyOptions } from "discord.js";
import { BaseContext } from "./baseContext";
import { GiveawayClient } from "./client";
import pg from "pg"

export class CommandContext extends BaseContext{
    interaction: BaseCommandInteraction
    member?: GuildMember
    arguments: Collection<string, CommandInteractionOption>
    constructor(client: GiveawayClient, interaction: BaseCommandInteraction, member: GuildMember | undefined, sql: pg.Pool){
        super(client, sql)
        this.interaction = interaction
        this.member = member
        this.arguments = new Collection(
            this.interaction.options.data
            .filter(v => v.type !== "SUB_COMMAND" && v.type !== "SUB_COMMAND_GROUP")
            .map(v => ([v.name, v]))
        )
    }

    async reply(options: (InteractionReplyOptions)) {
        return await this.interaction.reply(options)
    }

    async editReply(options: (InteractionReplyOptions)) {
        return await this.interaction.reply(options)
    }

    async deferReply(options: (InteractionDeferReplyOptions)) {
        return this.interaction.deferReply(options)
    }

    async followUp(options: (InteractionReplyOptions)) {
        return this.interaction.followUp(options)
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