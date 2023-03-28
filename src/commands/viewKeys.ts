import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "viewkeys",
    description: "Shows pending keys for a giveaway",
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
        this.description = `Shows keys for a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.interaction.options.getString("message_id", true)
        let keys = await ctx.sql.query(`SELECT * FROM prizes WHERE id=$1`, [id])
        if(!keys.rowCount) return ctx.error("No keys for that giveaway found")
        let file = new AttachmentBuilder(Buffer.from(keys.rows.map(r => `Prize: ${r.prize} || Pending User: ${r.user_id ?? "none"}`).join("\n")), {name: `${id}_keys.txt`})
        ctx.reply({content: `You have ${keys.rowCount} pending keys below from giveaway ${id}`, files: [file], ephemeral: true})
    }
}