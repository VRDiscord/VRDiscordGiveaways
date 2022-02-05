import { ApplicationCommand, CommandInteraction, GuildMember, Intents } from "discord.js"
import { readFileSync, existsSync, readdirSync } from "fs"
import { GiveawayClient } from "./classes/client"
import { CommandContext } from "./classes/commandContext"
import pg from "pg"
import { ButtonContext } from "./classes/buttonContext"
import { syncDB } from "./intervals/syncdb"
import { determineWinner } from "./intervals/determineWinners"

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/

if (existsSync(`${process.cwd()}/.env`))
    for (const line of readFileSync(`${process.cwd()}/.env`, 'utf8').split(/[\r\n]|\r\n/)) {
        let [, key, value] = line.match(RE_INI_KEY_VAL) || []
        if (!key) continue

        process.env[key] = value?.trim() || 'true'
}


const token = process.env["DISCORD_TOKEN"]
    , clientId = `${Buffer.from((token ?? "").split('.')[0] ?? "", 'base64')}`

const client = new GiveawayClient({
    intents: new Intents([
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS",
        "DIRECT_MESSAGE_TYPING",
        "GUILDS", "GUILD_BANS",
        "GUILD_EMOJIS_AND_STICKERS",
        "GUILD_INTEGRATIONS",
        "GUILD_INVITES",
        "GUILD_MEMBERS",
        "GUILD_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_MESSAGE_TYPING",
        "GUILD_PRESENCES",
        "GUILD_SCHEDULED_EVENTS",
        "GUILD_VOICE_STATES",
        "GUILD_WEBHOOKS"
])})


let connection = new pg.Client({
    user: process.env["DB_USERNAME"]!,
    host: process.env["DB_IP"]!,
    database: process.env["DB_NAME"]!,
    password: process.env["DB_PASSWORD"]!,
    port: Number(process.env["DB_PORT"]!),
})

readdirSync("./dist/commands")
.forEach(c => {
    const cmd = new ((require(`./commands/${c}`)).default)()
    cmd.client = client
    client.commands.set(cmd.name, cmd)
})

readdirSync("./dist/buttons")
.forEach(c => {
    const cmd = new ((require(`./buttons/${c}`)).default)()
    cmd.client = client
    client.buttons.set(cmd.name, cmd)
})

client.login(token)
connection.connect().catch(console.error)

const keepAlive = async () => {
    let res = await connection.query("SELECT * FROM giveaways LIMIT 1").catch(() => null)
    //await connection.query("DROP TABLE giveaways")
    //let res = await connection.query("CREATE TABLE giveaways (id varchar(21) not null primary key, duration bigint not null, users text[] not null default '{}', winners int not null, channel_id varchar(21) not null)")
    //let res = await connection.query("CREATE TABLE prizes (index SERIAL, id varchar(21) not null, prize varchar(255) not null, user_id varchar(21))")

    console.log(res)
    if(!res) {
        await connection.end().catch(() => null);
        await connection.connect().catch(() => null);
    }
}

const giveawayController = async () => {
    await syncDB(connection, client)
    await determineWinner(connection, client)
}

keepAlive()
giveawayController()

setInterval( keepAlive, 1000*60*60)
setInterval( giveawayController, 1000*60 )

connection.on("error", (e) => {
    console.error(e.message)
    const reconnect = setInterval(async () => {
        let res = await connection.query("SELECT * FROM giveaways LIMIT 1").catch(() => null)    
        if(!res) {
            await connection.end().catch(() => null);
            await connection.connect().catch(() => null);
        } else clearInterval(reconnect)
    }, 1000*60*2)
})


client.on("interactionCreate", async (interaction): Promise<any> => {
    if(interaction.channel?.type === "DM" && interaction.type !== "PING" && interaction.type !== "APPLICATION_COMMAND_AUTOCOMPLETE")
    return (interaction as CommandInteraction).reply({content: "You can't use commands in DMs"})

    if(interaction.isApplicationCommand()) {
        const command = client.commands.get(interaction.commandName)
        if(!command) return
        let member: GuildMember | undefined = undefined
        if(interaction.member?.permissions) {
            member = await interaction.guild?.members.fetch(interaction.member?.user.id!)!
        }
        const context = new CommandContext(client, interaction, member, connection)
        if(command.staffOnly && !member?.roles.cache.has(process.env["STAFF_ROLE_ID"]!)) return context.error("You are not staff")
        command.run(context).catch(console.error)
    } else if (interaction.isButton()) {
        const command = client.buttons.find(c => c.regex.test(interaction.customId))
        if(!command) return
        let member: GuildMember | undefined = undefined
        if(interaction.member?.permissions) {
            member = await interaction.guild?.members.fetch(interaction.member?.user.id!)!
        }
        const context = new ButtonContext(client, interaction, member, connection)
        if(command.staffOnly && !member?.roles.cache.has(process.env["STAFF_ROLE_ID"]!)) return context.error("You are not staff")
        command.run(context).catch(console.error)
    }
})

.on("ready", async () => {
    console.log(`Bot is ready`)
    await client.application?.commands.set(client.commands.map(c => c.command), process.env["GUILD_ID"]!).catch(console.error)
})
