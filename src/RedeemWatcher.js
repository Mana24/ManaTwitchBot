import puppeteer from "puppeteer";

export class RedeemWatcher {
   constructor(channel) {
      this.channel = channel
      this.ready = this.init();
      this.callbacks = [];
   }

   async init() {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(`https://www.twitch.tv/popout/${this.channel}/chat`);

      await page.exposeFunction('triggerRedeem', this.triggerRedeemObserved.bind(this));

      await page.evaluate(() => {
         const handleNode = (node) => {
            console.log("handling node");
            if (!node.querySelector || !node.querySelector(':has(.channel-points-reward-line__icon)')) return;
            // div > div > (text, icon, text)
            const redeemParts = []
            node.firstChild.childNodes.forEach((childNode) => {
               if (childNode.nodeType === 3) { redeemParts.push(childNode.textContent.trim()); }
            })

            const redeemCost = redeemParts[1];

            // Get redeem user and title
            let username = '';
            let redeemTitle = ''
            const nameSpan = node.querySelector('.chat-author__display-name')
            if (nameSpan) {
               username = nameSpan.getAttribute('data-a-user');
               // e.g. Redeemed Highlight My Message
               redeemTitle = redeemParts[0].split(' ').slice(1).join(' ') // Remove first word
            } else {
               // e.g. Mana248 redeemed I'm lurking, but ello 
               const nameAndTitle = redeemParts[0].split(' redeemed ');
               username = nameAndTitle[0];
               redeemTitle = nameAndTitle[1];
            }

            window.triggerRedeem(username, { redeemCost, redeemTitle });
         }

         const onObserve = (records) => {
            records.forEach(record => {
               record.addedNodes?.forEach(handleNode);
            });
         }

         const observer = new MutationObserver(onObserve);

         observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
         });
      })

      console.log("Redeem observer started");
   }

   triggerRedeemObserved(user, redeemInfo) {
      console.info(`${user} redeemed '${redeemInfo.redeemTitle}'`);
      for (const callback of this.callbacks) {
         callback(user, redeemInfo);
      }
   }
   
   addRedeemListener(callback) {
      this.callbacks.push(callback);
   }
}
