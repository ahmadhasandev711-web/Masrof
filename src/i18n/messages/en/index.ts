import core from "./core";
import auth from "./auth";
import dashboard from "./dashboard";
import pages from "./pages";
import forms from "./forms";
import marketing from "./marketing";
import homepage from "./homepage";
import faq from "./faq";
import plans from "./plans";
import reports from "./reports";
import admin from "./admin";
import legal from "./legal";
import notifications from "./notifications";
import whatsapp from "./whatsapp";
import workspaceTeam from "./workspace-team";

const messages = {
 ...core,
 ...auth,
 ...dashboard,
 ...pages,
 ...forms,
 ...marketing,
 ...homepage,
 ...faq,
 ...plans,
 ...reports,
 ...admin,
 ...legal,
 ...notifications,
 ...whatsapp,
 ...workspaceTeam,
};

export default messages;
