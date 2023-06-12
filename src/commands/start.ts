import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import request from "centra"

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "start",
    description: "Starts a giveaway",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "title",
        description: "A short title summarizing the giveaway",
        required: true,
        max_length: 500
    },{
        type: ApplicationCommandOptionType.String,
        name: "duration",
        description: "How long the giveaway should wait to determine winners (e.g. 2m for 2 minutes)",
        required: true
    }, {
        type: ApplicationCommandOptionType.String,
        name: "prize-description",
        description: "The description of the prize (e.g. 20 keys)",
        required: true,
        max_length: 1500,
        min_length: 1
    }, {
        type: ApplicationCommandOptionType.Attachment,
        name: "prize_file",
        description: "A text file with keys sepperated by \\n",
        required: true
    }, {
        type: ApplicationCommandOptionType.Integer,
        name: "winners",
        description: "How many winners should be determined",
        required: true,
        min_value: 1,
    }, {
        type: ApplicationCommandOptionType.String,
        name: "host",
        description: "Who hosts the giveaway",
    },{
        type: ApplicationCommandOptionType.Role,
        name: "mention",
        description: "Who to mention when the giveaway has started",
    }]
}

let button = [{
    type: 1, 
    components: [{
        type: 2,
        style: 1,
        label: "Participate",
        custom_id: "participate"
    }]
}]

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Starts a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        const title = ctx.interaction.options.getString("title", true)
        let duration = ctx.getTime(ctx.interaction.options.getString("duration", true))
        if(!duration) return ctx.error("You need a valid duration higher than 0")
        if(duration > 1000*60*60*24*365) ctx.error("You can't host a giveaway longer than a year")
        let description = ctx.interaction.options.getString("prize-description", true)
        let mention = ctx.interaction.options.getRole("mention")
        let host = ctx.interaction.options.getString("host") ?? ctx.interaction.user.username
        let winners = ctx.interaction.options.getInteger("winners", true)
        const attachment = ctx.interaction.options.getAttachment("prize_file", true)
        let prizes = await request(attachment.url, "GET").send().then(res => {
            if(res.statusCode !== 200) return []
            return res.body.toString().replace(/\r/g, "").split("\n").filter(v => v)
        }).catch(() => [])

        if(!prizes.length) return ctx.error("That's not a valid attachment url")

        if(prizes.length > 1 && prizes.length !== winners) return ctx.error(`When giving more than one prize the number of prizes must match the number of winners (${prizes.length})`)
    
        let embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle(`New Giveaway by ${host}`)
        .setDescription(`${title}\n\n**Prize** ${description}\n**Winners** ${winners}\n**Ends** <t:${Math.floor((Date.now() + duration)/1000)}:R>`)
        .setFooter({text: "Please make sure your direct messages are open before the givaway ends. The prize will be sent to you if you are chosen as a winner."})
    
        let id = await ctx.interaction.channel?.send({content: !mention ? undefined : mention.id === ctx.interaction.guildId ? "@everyone" : `<@&${mention.id}>`, embeds: [embed], components: button}).catch(console.error)
        if(!id?.id) return ctx.error("Unable to start giveaway")

        let req = await ctx.sql.query(`INSERT INTO giveaways (id, duration, winners, channel_id, rolled, name, prize_description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [id.id, Date.now()+duration, winners, id.channelId, false, title, description]).catch(console.error)
        if(!req) {
            id?.delete()
            return ctx.error("Unable to start giveaway")
        }

        ctx.client.giveawayCache.set(id.id, [])

        let result = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle(`Giveaway started by ${host}`)
        .setDescription(`**Prize**: ${description}`)
        .setFooter({text: `ID: ${id.id}`})
        .addFields([
            {name: "**Ends**", value: `<t:${Math.floor((Date.now() + duration)/1000)}:R>`, inline: true},
            {name: "**Winners**", value: `${winners}`, inline: true},
            {name: "**Prizes**", value: `${prizes.length}`, inline: true}
        ])

        ctx.reply({
            embeds: [result],
            ephemeral: true
        })


        let query = `INSERT INTO prizes (id, prize) VALUES ${prizes.map((_, i) => `($1, $${i+2})`).join(", ")}`

        ctx.sql.query(query, [id.id, ...prizes]).catch(console.error)

        ctx.log(result)
    }
}
