# Frequently Asked Questions

### I can't find [game feature] anywhere. Is it implemented yet, are there plans for it?

Have a look in the System Wiki if you can find what you are looking for there. Some things are not obvious at first glance, but should be explained in the Wiki

But chances are, the feature you are looking for has not been implemented yet. Feel free to ask about it on the [Foundry discord server](https://discord.com/channels/170995199584108546/1390065189453435041) ir the [MDCDM discord server](https://discord.com/channels/332362513368875008/1342298358664138805).

If there are no plans yet to implement it, search on GitHub in our [reposiroty issues](https://github.com/MetaMorphic-Digital/draw-steel/issues) if someone else might already have requested it, and if not please open a [feature request ticket](https://github.com/MetaMorphic-Digital/draw-steel/issues/new/choose) on so it is visible on our to-do list.

### What Foundry modules are recommended to enhance this system?

We wouldn't want to call any modules "recommended" given that the system isn't feature complete yet, nor having hit v1.0.0 either. What might be "recommended" now could change in a week.

Beyond this it is important to consider that Foundry modules have a cost that must be evaluated:
- Content modules cost money. While the system doesn't have any exclusive content modules, there are many premium asset packs for things like scenes and playlists
- Immersion modules have performance costs. Anything modifying the canvas behavior or display can have performance costs, and since Foundry's rendering happens entirely client-side you need to be aware of the limitations of the weakest computer.
- Automation modules cost time to configure & troubleshoot, especially during game prep.

### If I would want to get a certain module compatibility working with the Draw Steel system, what do I need to do about that?

- We're happy to provide guidance to users integrating modules for personal configuration, submitting pull requests to modules, or creating compatibility modules
- We're willing to take pull requests for module compatibility on a limited basis; the system already provides integration for **Dice so Nice** natively

###  My enrichers are not working! What am I doing wrong?

Check the wiki page on enrichers to make sure you are using the right format.