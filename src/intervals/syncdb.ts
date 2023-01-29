import { GiveawayClient } from "../classes/client";
import pg from "pg"
import { Collection } from "discord.js";

export async function syncDB(sql: pg.Pool, client: GiveawayClient){
    await Promise.all(
        client.giveawayCache.map(async (v, k) => {
            await sql.query(`UPDATE giveaways SET users=$1 WHERE id=$2 RETURNING *`, [`{${v.join(", ")}}`, k])
        })
    )

    let backsync = await sql.query(`SELECT * FROM giveaways`);
    backsync.rows.map(r => {
        if(!client.giveawayCache.has(r.id)) client.giveawayCache.set(r.id, r.users)
    })
}