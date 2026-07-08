const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://andrereis-agent:andrereis@andre-reis.kql7jps.mongodb.net/?appName=andre-reis";
const client = new MongoClient(uri);
client.connect().then(async () => {
  const db = client.db("andre_reis_leads");
  const withOutreach = await db.collection("leads").findOne({ outreach_message: { $exists: true, $ne: null } });
  console.log("Lead com outreach_message:", withOutreach ? withOutreach._id.toString() : "NENHUM");
  if (withOutreach) {
    console.log(JSON.stringify({
      outreach_message: withOutreach.outreach_message,
      outreach_message_subject: withOutreach.outreach_message_subject,
      outreach_angle: withOutreach.outreach_angle,
      outreach_message_status: withOutreach.outreach_message_status,
    }, null, 2));
  }
  await client.close();
});
