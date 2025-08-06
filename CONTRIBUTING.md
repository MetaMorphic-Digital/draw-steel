# Contributing to draw-steel

Code and content contributions are accepted. Please feel free to submit issues to the issue tracker or submit merge requests for code/content changes. Approval for such requests involves code and (if necessary) design review by the Maintainers of this repo.

Please ensure there is an open issue about whatever contribution you are submitting. Please also ensure your contribution does not duplicate an existing one.

## Developer Tooling

To start, clone this repository and either place it in or symlink it to your `Data/systems/draw-steel` user data directory.

To provide type and i18n support, this repository uses a postinstall script that symlinks your local Foundry installation. For this to work, copy `example-foundry-config.yaml` and rename it to `foundry-config.yaml`, then replace the value of the `installPath` field.

Once this is done you can run `npm install` to install all relevant dependencies. This includes `eslint`, which provides formatting support.

For vscode, you will need to create a `.vscode/settings.json` file with the following:

```json
{
  "eslint.enable": true,
  "eslint.validate": ["javascript", "handlebars", "html"]
}
```

Also copy the following into your `.vscode/settings.json` to support i18n-ally:
```json
"i18n-ally.localesPaths": [
  "foundry/lang",
  "lang"
],
"i18n-ally.keystyle": "nested",
```

### VSCode support for i18n

If you are using VSCode, the i18n Ally (ID: `lokalise.i18n-ally`) extension will preview the content of i18n strings by pulling from both `lang/en.json` as well as the symlinked core translation files at `foundry/lang/en.json`.

## Compendiums

The system supports compendium content for 1st party material licensed through the Draw Steel Creator's License. That means:

- No 3rd party content
- No playtest material
- No unlicensed releases (e.g. the Delian Tomb)

The files for compendium content are available in the `src/packs` directory.

### Creating and updating content

Modifications to compendium content should be performed from within foundry. This process requires having a dev install of the system, not the version downloaded from the package repository.

1. While Foundry is closed, use `npm run build:packs` to make sure your local database files align with the material in the source files.
2. Open foundry and open a world with zero modules.
3. Unlock the compendium(s) you wish to adjust; there will be a dialog warning you about edit to system files, but in this case that is exactly what you want to be doing.
4. Create or edit content as needed within the compendiums.
5. When you are done, close down Foundry and run `npm run unpack`
6. Your changes should appear as edits to the json files within `src/packs`. You may then commit those changes and submit them as a pull request.

#### Style Guide

To maintain consistency across the repository, keep the following rules in mind:
- Not every feature is supported by automation; it's better to have the rules text and leave it up to individual groups to handle than use an ugly hack
- If something seems like it should be supported by automation, check if there's already a ticket, and if there's not, feel free to file one requesting support.
- All documents should have a thematically appropriate icon selected from the core foundry icons.
  - Linked documents (e.g. a career and its incidents table) should have matching icons.
  - Table results are the exception; only the table itself needs a unique icon.
- HTML fields should be clean without extra styles added from pasting.

Specific notes by type:

**Abilities**
- For abilities with no power roll, the "before" effect is preferred to the "after".

**Ancestry**
- The description on the ancestry itself should be the info text.
- Even features that only grant abilities should be created as both, for the purpose of easy inclusion in trait purchasing.

**Career**
- Inciting incidents tables should be linked by `@UUID` reference.

**Culture**
- The core book's cultures are not expected to have descriptions, and the advancement titles should consist solely of the aspect (e.g. "Communal").

<!-- Complication -->

**Class and Subclass**
- If a class or subclass feature only exists to grant an ability, e.g. the Tactician's Mark, just grant the ability directly and put the extra description in the Advancement.

**Equipment**
- Each tier of benefits for a leveled treasure should be implemented as a separate active effect with the idea that *only* that effect will be active.

**Feature**
- Not having a subtype is perfectly reasonable, many features are neither perks nor titles.
- Titles should be replicated for each of their descendant options, e.g. `Ratcatcher: Come Out to Play`, `Ratcatcher: Deadly and Big`, and `Ratcatcher: Everybody Move!` each with the `_dsid` of `ratcatcher`.
- Ancestry Abilities should not include the point cost in their name or _dsid.

**Kit**
- Keep in mind that the book's abilities already include the kit bonus, so the ones in the compendium should *not* include the kit bonus to avoid double-counting.

<!-- Project -->

### Translations

The core system will only support english-language compendium content. [Babele](https://foundryvtt.com/packages/babele) integrations should be provided by separate translation modules.

## Wiki

The pages for the wiki are maintained in `src/docs`. These files also double as the markdown source for the System Documentation journal entry. Updates to this journal will be propagated back to the relevant files by the compendium unpack operation, and updates to these files will be included whenever the journals are rebuilt.

Not all wiki pages are included in the System Documentation journal. To add a mirrored page to the journal, create a new page inside foundry and set the `flags.draw-steel.wikiPath` property to the name of the file, then unpack the compendiums. Otherwise, files inside `src/docs` will be wiki-exclusive.

## Issues

Check that your Issue isn't a duplicate (also check the closed issues, as sometimes work which has not been released closes an issue). Issues which are assigned to a Milestone are considered "Prioritized." This assignment is not permanent and issues might be pushed out of milestones if the milestone is approaching a releaseable state without that work being done.

### Bugs

- Ensure that the bug is reproducible with no modules active. If the bug only happens when a module is active, report it to the module's author instead.
- Provide hosting details as they might be relevant.
- Provide clear step-by-step reproduction instructions, as well as what you expected to happen during those steps vs what actually happened.

### Feature Requests

Any feature request should be considered from the lens of "Does this belong in the core system?"
- Do the Rules as Written (RAW) support this feature? If so, provide some examples.
- Does this feature help a GM run a Draw Steel game in Foundry VTT?

## Code

Here are some guidelines for contributing code to this project.

To contribute code, [fork this project](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and submit a [pull request (PR)](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-a-pull-request) against the correct development branch.

### Style

Please attempt to follow code style present throughout the project. An ESLint profile is included to help with maintaining a consistent code style. All warnings presented by the linter should be resolved before an PR is submitted.

- `npm run lint` - Run the linter and display any issues found.
- `npm run lint:fix` - Automatically fix any code style issues that can be fixed.

### Linked Issues

Before (or alongside) submitting an PR, we ask that you open a feature request issue. This will let us discuss the approach and prioritization of the proposed change.

If you want to work on an existing issue, leave a comment saying you're going to work on the issue so that other contributors know not to duplicate work. Similarly, if you see an issue is assigned to someone, that member of the team has made it known they are working on it.

When you open an PR it is recommended to [link it to an open issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue). Include which issue it resolves by putting something like this in your description:

```text
Closes #32
```

### Priority of Review

Please appreciate that reviewing contributions constitutes a substantial amount of effort and our resources are limited. As a result of this, Pull Requests are reviewed with a priority that roughly follows this:

#### High Priority

- Bug Fix
- Small Features related to issues assigned to the current milestone

#### Medium Priority

- Large Features related to issues assigned to the current milestone
- Small Features which are out of scope for the current milestone

#### Not Prioritized

- Large Features which are out of scope for the current milestone

### Pull Request Review Process

PRs have a few phases:

0. **Prioritization.** If the PR relates to the current milestone, it is assigned to that milestone.
1. **Initial Review from the Draw Steel contributor team.** This lets us spread out the review work and catch some of the more obvious things that need to be fixed before final review. Generally this talks about code style and some methodology.
2. **Final Review from the Maintainers.** ChaosOS and Zhell have final review and are the only ones with merge permission.

#### PR Size

Please understand that large and sprawling PRs are exceptionally difficult to review. As much as possible, break down the work for a large feature into smaller steps. Even if multiple PRs are required for a single Issue, this will make it considerably easier and therefore more likely that your contributions will be reviewed and merged in a timely manner.

## Releases

This repository includes a GitHub Actions configuration which automates the compilation and bundling required for a release when a Tag is pushed or created with the name `release-x.y.z`.

### Prerequisites

If either of these conditions are not met on the commit that tag points at, the workflow will error out and release assets will not be created.

- The `system.json` file's `version` must match the `x.y.z` part of the tag name.
- The `system.json` file's `download` url must match the expected outcome of the release CI artifact. This should simply be changing version numbers in the url to match the release version.

```text
https://github.com/foundryvtt/dnd5e/releases/download/release-1.6.3/dnd5e-1.6.3.zip
                                                     └─ Tag Name ──┘     └─ V ─┘ (version)
```

### Process for Release

`main` is to be kept as the "most recently released" version of the system. All work is done on development branches matching the milestone the work is a part of. Once the work on a milestone is complete, the following steps will create a system release:

1. [ ] The `system.json` file's `version` and `download` fields are updated on the development branch (e.g. `1.2.3`).
2. [ ] A tag is created at the tip of the development branch with the format `release-x.y.z`, triggering the CI workflow.
3. [ ] The `develop` Branch is merged to `main` after the workflow is completed.
4. [ ] The foundryvtt.com admin listing is updated with the `manifest` url pointing to the `system.json` attached to the workflow-created release.
