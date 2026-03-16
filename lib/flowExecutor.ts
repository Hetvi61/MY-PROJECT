import ScheduledJob from "@/models/ScheduledJob";

function normalisePhone(input?: string | null) {
  if (!input) return "";

  let p = input.replace(/\D/g, ""); // remove non-digits

  if (p.startsWith("0")) {
    p = p.slice(1);
  }

  if (!p.startsWith("91")) {
    p = "91" + p;
  }

  return p;
}

export async function executeFlow(client: any, nodes: any[]) {

  let currentTime = new Date();

  for (const node of nodes) {

    // DELAY NODE
    if (node.type === "delayNode") {
      const minutes = node.data.minutes || 1;

      currentTime.setMinutes(
        currentTime.getMinutes() + minutes
      );
    }

    // MESSAGE NODE
    if (node.type === "messageNode") {

      const rawPhone = client.mobile || client.phone || "";
      const phoneNumber = normalisePhone(rawPhone);

      if (!phoneNumber) {
        console.error("Client phone missing");
        continue;
      }

      const messageText = node?.data?.text || "";

      if (!messageText) {
        console.error("Message text missing");
        continue;
      }

      console.log("Creating WhatsApp Job:", phoneNumber, messageText);

      await ScheduledJob.create({

        client_name: client.clientName,

        job_name: "Automation Message",

        job_type: "whatsapp",

        job_json: {
          phone: phoneNumber,
          message: messageText
        },

        created_datetime: new Date(),

        scheduled_datetime: new Date(currentTime),

        created_from: "ui",

        job_status: "to_do"

      });
    }
  }
}