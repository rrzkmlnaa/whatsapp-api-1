import { app, io, server } from "./server";
import { client, status } from "./wa";
import { indexRouteHandler } from "./routeHandlers";
import dashboardRouter from "./domain/dashboard/labels.routes";
import contactRouter from "./domain/contacts/contacts.routes";
import groupsRouter from "./domain/groups/group.routes";
import groupContactsRouter from "./domain/group-contacts/groupContacts.routes";
import messageRouter from "./domain/messages/messages.routes";
import labelRouter from "./domain/labels/labels.routes";
import contactLabelRouter from "./domain/contact-labels/contactsLabels.routes";

io.on("connection", () => {
  io.emit("status", status);
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/contact-labels", contactLabelRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/group-contacts", groupContactsRouter);
app.use("/api/messages", messageRouter);
app.use("/api/labels", labelRouter);
app.get("/", (req, res) => res.send("Hello World!"));
app.get("/api/status", indexRouteHandler);

// listen on port 3000
server.listen(3000, () => {
  client.initialize();
  console.log("Server listening on port 3000");
});

// test
