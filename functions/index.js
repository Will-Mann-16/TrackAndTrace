const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { DateTime } = require("luxon");

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

//const EMAIL = "ee18hj@leeds.ac.uk";
const EMAIL = "will@willmann.me.uk";


const transport = nodemailer.createTransport({
  host: "smtp.ionos.co.uk",
  port: 587,
  auth: {
    user: "no-reply@willmann.me.uk",
    pass: "NfZRVDURh7Ux.",
  },
});

exports.emailListForThatDay = functions.pubsub
  .schedule("0 18 * * *")
  .timeZone("Europe/London")
  .onRun((context) => {
    async function sendMessage() {
      try {
        const data = await admin
          .firestore()
          .collection("sessions")
          .where(
            "start",
            ">",
            DateTime.fromJSDate(admin.firestore.Timestamp.now().toDate())
              .startOf("day")
              .toJSDate()
          )
          .where(
            "start",
            "<",
            DateTime.fromJSDate(admin.firestore.Timestamp.now().toDate())
              .endOf("day")
              .toJSDate()
          )
          .get();

        if (data.size > 0) {
          const sessions = await Promise.all(
            data.docs.map(async (session) => {
              const team = await admin
                .firestore()
                .collection("teams")
                .doc(session.team)
                .get();
              const attending = await admin
                .firestore()
                .collection("users")
                .where(
                  admin.firestore.FieldPath.documentId(),
                  "in",
                  session.attending
                )
                .get();
              return {
                ...session.data(),
                id: session.id,
                team: { ...team.data(), id: team.id },
                attending: attending.docs.map((e) => ({
                  id: e.id,
                  ...e.data(),
                })),
              };
            })
          );
          const mailOptions = {
            from: "no-reply@willmann.me.uk",
            to: EMAIL,
            subject: "Track and Trace Sport - Sessions Today",
            html: sessions
              .map(
                (session) => `<h1>${session.team.name}</h1>
                <h2>${DateTime.fromJSDate(session.start.toDate()).toFormat(
                  "ccc dd LLL T"
                )} - ${DateTime.fromJSDate(session.end.toDate()).toFormat(
                  DateTime.fromJSDate(session.start.toDate()).hasSame(
                    DateTime.fromJSDate(session.end.toDate()),
                    "day"
                  )
                    ? "T"
                    : "ccc dd LLL T"
                )}</h2>
                  <p>${session.description}</p>
                  <h3>${session.attending.length} attended</h3>
                  <ul>
                        ${session.attending
                          .map(
                            ({ displayName, email, phoneNumber }) =>
                              `<li>${displayName} - ${email} - ${phoneNumber}</li>`
                          )
                          .join("")}
                  </ul>`
              )
              .join("<br/>"),
          };

          const info = await transport.sendMail(mailOptions);
        }
      } catch (e) {
        console.error(e);
      }
    }

    sendMessage();

    return null;
  });
