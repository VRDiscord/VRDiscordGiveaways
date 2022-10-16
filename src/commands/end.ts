import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { determineWinner } from "../intervals/determineWinners";
import { syncDB } from "../intervals/syncdb";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "end",
    description: "Ends a giveaway",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Ends a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.arguments.get("message_id")?.value
        await ctx.sql.query(`UPDATE giveaways SET duration=${Date.now()-1} WHERE id=$1 RETURNING *`, [id])
        ctx.reply({content: "Ending giveaway...", ephemeral: true})
        await syncDB(ctx.sql, ctx.client)
        await determineWinner(ctx.sql, ctx.client)

        ctx.log(`${ctx.interaction.member?.user.username}#${ctx.interaction.member?.user.discriminator} ended the giveaway \`${id}\``)
    }
}