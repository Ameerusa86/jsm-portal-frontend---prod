# JSM Portal Updates: Search & Smart Ticket Routing

Hey everyone, I want to walk you through some major improvements we've just made to our custom JSM portal. We've completely overhauled how the global search works and built a new, highly scalable way to route users directly from help articles to the correct ticket forms.

## 1. A Cleaner, Smarter Search Experience

Previously, our homepage search was a bit cluttered with "Quick Intent" chips and a "2-Step Request Finder" that took up too much space and didn't feel as seamless as we wanted. 

**What we did:**
* **Removed the Clutter:** We stripped out the quick intents and the 2-step finder. The UI is now a single, clean, Google-style search bar.
* **Improved Natural Language Processing:** The biggest issue with the old search was that if a user typed a long, conversational sentence like *"I can't login to my computer"*, the search engine got confused by words like "I", "can't", and "to". 
* We built a massive stop-word filter into the search algorithm. Now, when a user types a messy sentence, the system instantly strips out the filler words (over 100 common words) behind the scenes. It narrows it down to the core keywords (like *"login computer"*) and returns the correct Service Request and Help Articles perfectly.
* **Prioritized Help Articles:** When you search, the dropdown now prioritizes our Knowledge Base articles at the top of the list, right above the Service Requests, encouraging users to read a solution before submitting a ticket.

## 2. The Smart Routing System (The `rt-` Strategy)

**The Problem:** 
In native Jira Service Management, if a user searches for an article from the global homepage, reads it, and it doesn't fix their issue, they are often dumped back into the main catalog to figure out which ticket form to use. We wanted to force deflection: make them read the article, and if it fails, send them *immediately* to the specific ticket form for that exact issue.

**The Solution:**
We built a custom invisible mapping system using **Confluence Labels**. 

**Here is how it works:**
1. The end-user searches for *"my vpn is broken"*. They don't need to know any special keywords or IDs; they just search naturally.
2. The search bar finds the "VPN Troubleshooting" article and the user clicks it.
3. If the article doesn't solve their problem, they see a blue **"Submit a Ticket"** button at the bottom of the page.
4. When they click it, it bypasses the catalog entirely and opens the exact VPN ticket form.

**How does the system know which form to open?**
This is the brilliant part for our IT team. When we write an article in Confluence, we just add a secret label to it. For example, if the ID for our VPN Request Type is `45`, we add the label `rt-45` to the Confluence article. 

* The `rt` stands for "Request Type".
* The user *never* sees this label, and they never have to type it. 
* Our Next.js app reads the article from Confluence, invisibly spots the `rt-45` label, and automatically wires up the "Submit a Ticket" button to form 45.

## 3. What We Need To Do Now (Action Items)

Because this is driven entirely by Confluence labels, we don't need to involve developers or touch the codebase every time we write a new article. The IT team has 100% control.

## The Architecture Decision: A "Hybrid" Approach

One critical decision we made during this update was adopting a **Hybrid Architecture** for the portal. 

### Why a Hybrid Approach?
During development, we discovered a strict technical limitation with Atlassian's API: **Jira Forms (formerly ProForma)**. 
While our custom Next.js portal is fully capable of rendering standard Jira Custom Fields natively, Atlassian heavily locks down ProForma forms. The Atlassian REST API does not allow third-party apps to fetch or render ProForma form structures for customers.

Because our Service Desk relies heavily on ProForma to build request types, rendering the forms purely inside the custom portal would result in blank pages for our users.

### How it Works (Option A)
To solve this, we implemented a seamless handoff:
1. **The "Front Door":** Users start in our lightning-fast, beautiful Next.js application. They can browse the catalog, read knowledge base articles natively, and use our improved natural language search.
2. **The "Handoff":** The exact moment a user clicks a Service Card or clicks "Submit a Ticket" on an article, we instantly and securely redirect them to the exact Request Type form in the old native Atlassian portal.
3. **The Benefit:** Users get the best of both worlds—a highly optimized, modern discovery experience, while ensuring 100% compatibility with our complex ProForma routing and ticket submission backend. 

*(Note: We have left the code for the fully custom form ("Option B") intact but disabled. If we ever decide to rebuild our request types using standard Jira Custom Fields instead of ProForma, a developer can simply flip a true/false switch in the code to instantly bring the forms natively into the Next.js app!)*

**Next Steps for the IT / Knowledge Base Team:**
1. **Identify High-Deflection Articles:** Pick the articles we want to aggressively deflect with (e.g., Login issues, VPN, Hardware repairs).
2. **Find the Target Request Type ID:** Look at the URL of the Request Type form we want to route to and grab its ID.
3. **Add the Label:** Go into Confluence, edit the article, and add a label formatted exactly as `rt-[ID]` (e.g., `rt-45`).
4. **Publish:** That's it. The portal will instantly start routing users from that article directly to the correct form.

If we have an article that *shouldn't* route to a specific form, we just leave the label off, and it will behave like a standard knowledge base document.

This setup gives us incredible flexibility, keeps our Confluence clean, and ensures a seamless experience for our end-users.
