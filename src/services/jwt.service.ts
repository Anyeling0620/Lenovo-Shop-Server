import { db } from "../utils/db";

export async function verifyUser(userId:string) {
    const user_id = await db.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true
        }
    })
    if (!user_id) {
        return false;
    }
    return true;
    
}