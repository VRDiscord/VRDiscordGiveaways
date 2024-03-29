import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { syncDB } from "../intervals/syncdb";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "removeparticipant",
    description: "Removes a participant",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    },{
        type: ApplicationCommandOptionType.User,
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
        const user = ctx.interaction.options.getUser("user", true)
        const id = ctx.interaction.options.getString("message_id", true)
        if(!ctx.client.giveawayCache.has(id)) return ctx.error("Unable to find giveaway")
        ctx.client.giveawayCache.set(id, ctx.client.giveawayCache.get(id)!.filter(u => u !== user.id))
        syncDB(ctx.sql, ctx.client)
        const giveaway = await ctx.sql.query("SELECT * FROM giveaways WHERE id=$1", [id]).then(res => res.rows[0]).catch(console.error)

        ctx.reply({content: `Removed the user <@${user.id}> (\`${user.id}\`) from the giveaway "${giveaway.name}" \`${id}\``, components: [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}`}]}]})
        ctx.log(`${ctx.interaction.user.username} removed the participant <@${user.id}> (\`${user.id}\`) from the giveaway "${giveaway.name}" \`${id}\``, [{type: 1, components: [{type: 2, label: "View Message", style: 5, url: `https://discord.com/channels/${process.env["GUILD_ID"]}/${giveaway.channel_id}/${giveaway.id}`}]}])
    }
}