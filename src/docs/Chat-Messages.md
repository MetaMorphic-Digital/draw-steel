The chat messages in Draw Steel are an important interface for interactions between players and the Director. They are also responsible for displaying usage information and showing roll results.

The Foundry [Knowledge Base](https://foundryvtt.com/article/chat/) has more info on the basics of chat messages; this page is focused on system-specific information.

## Roll Messages

Draw Steel will interpret the provided rolls to a message to add additional functionality. The default `/roll` command will only create a generic roll, but clicking on enrichers like `/damage` can create other types of rolls.

### Dealing and Taking Damage

Any chat message with a damage roll will have an "Apply Damage" button that can be used to deal that damage to _selected_ (controlled) tokens. This will take into account the actor's immunities and weaknesses.

## Ability Messages

Using an ability creates a special type of chat message with additional data and functionality tied to the ability.

### Apply Effect

Abilities with an "Applied Effect" power roll effect will have the option to apply the effect to _selected_ (controlled) tokens. This will automatically account for the configuration of the effect, e.g., if at certain tiers it should be until End of Turn vs. Save Ends.

## Project Roll Messages

Project rolls can prompt for project event rolls depending on the world settings.
