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
        const id = ctx.interaction.options.getString("message_id", true)
        const updated = await ctx.sql.query(`UPDATE giveaways SET duration=$2 WHERE id=$1 RETURNING *`, [id, (Date.now()-1)])
        ctx.reply({content: "Ending giveaway...", ephemeral: true})
        await syncDB(ctx.sql, ctx.client)
        await determineWinner(ctx.sql, ctx.client)

        ctx.log(`${ctx.interaction.user.username} ended the giveaway "${updated.rows[0].name}" \`${id}\``, [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${updated.rows[0].channel_id}/${updated.rows[0].id}`}]}])
    }
}