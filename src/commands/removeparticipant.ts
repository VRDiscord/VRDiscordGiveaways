import { ApplicationCommandData } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { syncDB } from "../intervals/syncdb";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "removeparticipant",
    description: "Removes a participant",
    options: [{
        type: "STRING",
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    },{
        type: "USER",
        name: "user",
        description: "The user you want to remove",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Removes a participant`
    }
    async run(ctx: CommandContext): Promise<any> {
        let user_id = ctx.arguments.get("user")?.value?.toString() ?? ""
        let id = ctx.arguments.get("message_id")?.value?.toString() ?? ""
        ctx.client.giveawayCache.set(id, ctx.client.giveawayCache.get(id)!.filter(u => u !== user_id))
        syncDB(ctx.sql, ctx.client)

        ctx.reply({content: `Removed the user <@${user_id}> (\`${user_id}\`) from the giveaway \`${id}\``})
        ctx.log(`${ctx.interaction.member?.user.username}#${ctx.interaction.member?.user.discriminator} removed the participant <@${user_id}> (\`${user_id}\`) from the giveaway \`${id}\``)
    }
}