import * as Mustache from 'mustache';

import { ITag } from './ITag';
import { ITagInputOptions } from './ITagInputOptions';

// tslint:disable-next-line: no-empty
function noop(...args: any[]): any {
}

function matches(el: Element, selector: string): boolean {
    return (el.matches || el.webkitMatchesSelector).call(el, selector);
}

enum Key {
    ENTER = 'Enter',
    TAB = 'Tab',
    BACKSPACE = 'Backspace',
    HOME = 'Home',
    END = 'End',
    LEFT_ARROW = 'ArrowLeft',
    UP_ARROW = 'ArrowUp',
    RIGHT_ARROW = 'ArrowRight',
    DOWN_ARROW = 'ArrowDown'
}

enum KeyNavDirection {
    UP,
    DOWN
}

const EmptyString = '';

const controlKeys = [
    Key.ENTER,
    Key.TAB,
    Key.BACKSPACE,
    Key.HOME,
    Key.END,
    Key.LEFT_ARROW,
    Key.UP_ARROW,
    Key.RIGHT_ARROW,
    Key.DOWN_ARROW
];

// Concatenate the key ranges for numbers and letters
const alphaKeys = 'abcdefghijklmnopqrstuvwxyz';
const alphaKeysLower = alphaKeys.split('');
const alphaKeysUpper = alphaKeys.toUpperCase().split('');

const numericKeys = '0123456789'.split('');

// The only symbol allowed by default is minus (-), which can be used to separate words in a tag
const symbolKeys = ['-'];

const standardValidTagCharacters: string[] =
    alphaKeysLower
        .concat(alphaKeysUpper)
        .concat(numericKeys)
        .concat(symbolKeys)
        .concat(controlKeys);

const standardHtmlTemplate =
`<div class="{{globalCssClassPrefix}}{{#containerClasses}} {{containerClasses}}{{/containerClasses}}">
    {{#tags}}{{> item}}{{/tags}}
    <input class="{{globalCssClassPrefix}}-data" type="hidden" name="{{hiddenInput.name}}" id="{{hiddenInput.id}}" value="{{hiddenInput.value}}">
    <div class="{{globalCssClassPrefix}}-input-container">
        <input class="{{globalCssClassPrefix}}-input" type="text"{{#placeholder}} placeholder="{{placeholder}}"{{/placeholder}}>
        <div class="{{globalCssClassPrefix}}-suggestions {{globalCssClassPrefix}}-suggestions-hidden"></div>
    </div>
</div>`;

const standardItemTemplate =
'<div class="{{globalCssClassPrefix}}-tag" data-id="{{id}}" data-label="{{label}}">{{label}} <i class="{{globalCssClassPrefix}}-removetag fa fa-times"></i></div>';

const standardSuggestionTemplate =
'<div class="{{globalCssClassPrefix}}-suggestion" data-id="{{id}}" data-label="{{label}}">{{label}}</div>';

export class TagInput<T> {
    private readonly data: ITag[];

    private readonly getId: (item: T) => string;
    private readonly getLabel: (item: T) => string;
    private readonly newItemFactory: (label: string) => Promise<T>;

    private readonly enableSuggestions: boolean;
    private readonly minCharsBeforeShowingSuggestions: number;
    private readonly maxNumberOfSuggestions: number;
    private readonly allowNewTags: boolean;

    private readonly tagDataSeparator: string;
    private readonly validTagCharacters: string[];
    private readonly allowUpperCase: boolean;

    private readonly onTagAdded: (instance: TagInput<T>, added: ITag[], selected: ITag[]) => void;
    private readonly onTagRemoved: (instance: TagInput<T>, removed: ITag[], selected: ITag[]) => void;
    // tslint:disable-next-line: max-line-length
    private readonly onTagsChanged: (instance: TagInput<T>, added: ITag[], removed: ITag[], selected: ITag[]) => void;

    private readonly tagInputContainer: HTMLElement;
    private readonly tagInputHiddenInput: HTMLInputElement;
    private readonly tagInputTextInput: HTMLInputElement;
    private readonly tagInputSuggestionDropdown: HTMLElement;

    private readonly globalCssClassPrefix: string;
    private readonly placeholderText: string;
    private readonly htmlTemplate: string;
    private readonly itemTemplate: string;
    private readonly suggestionTemplate: string;

    private readonly currentSelection: ITag[];

    private readonly warningClass: string;
    private readonly narrowedInputClass: string;
    private readonly multiCaseInputClass: string;
    private readonly suggestionDropdownClass: string;
    private readonly suggestionDropdownHiddenClass: string;
    private readonly suggestionClass: string;
    private readonly selectedSuggestionClass: string;

    constructor(options: ITagInputOptions<T>) {
        this.getId = options.getId;
        this.getLabel = options.getLabel;
        this.newItemFactory = options.newItemFactory;

        this.data = options.data.map(item => ({ id: this.getId(item), label: this.getLabel(item) }));

        const originalInput = options.input as HTMLInputElement;

        this.enableSuggestions = options.enableSuggestions === false ? false : true;
        this.minCharsBeforeShowingSuggestions = options.minCharsBeforeShowingSuggestions || 2;
        this.maxNumberOfSuggestions = options.maxNumberOfSuggestions || 100;
        this.allowNewTags = options.allowNewTags === false ? false : true;

        if (this.allowNewTags && !this.newItemFactory) {
            throw Error('A newItemFactory function must be specified if allowNewTags is true');
        }

        this.tagDataSeparator = options.tagDataSeparator || '|';
        this.validTagCharacters = options.validTagCharacters || standardValidTagCharacters;
        this.allowUpperCase = options.allowUpperCase || false;

        this.onTagAdded = options.onTagAdded || noop;
        this.onTagRemoved = options.onTagRemoved || noop;
        this.onTagsChanged = options.onTagsChanged || noop;

        this.globalCssClassPrefix = options.globalCssClassPrefix || 'mab-bootstrap-taginput';
        this.placeholderText = originalInput.getAttribute('placeholder');

        this.htmlTemplate = (options.htmlTemplate || standardHtmlTemplate).trim();
        this.itemTemplate = (options.itemTemplate || standardItemTemplate).trim();
        this.suggestionTemplate = (options.suggestionTemplate || standardSuggestionTemplate).trim();

        Mustache.parse(this.htmlTemplate);
        Mustache.parse(this.itemTemplate);
        Mustache.parse(this.suggestionTemplate);

        this.warningClass = `${this.globalCssClassPrefix}-tag-warning`;
        this.narrowedInputClass = `${this.globalCssClassPrefix}-input-narrowed`;
        this.multiCaseInputClass = `${this.globalCssClassPrefix}-input-multicase`;
        this.suggestionDropdownClass = `${this.globalCssClassPrefix}-suggestions`;
        this.suggestionDropdownHiddenClass = `${this.globalCssClassPrefix}-suggestions-hidden`;
        this.suggestionClass = `${this.globalCssClassPrefix}-suggestion`;
        this.selectedSuggestionClass = `${this.suggestionClass}-selected`;

        const selectedIds = originalInput.value.split(this.tagDataSeparator);

        this.currentSelection = this.data.filter(item => selectedIds.includes(item.id));

        const templateData: any = {
            containerClasses: originalInput.classList.value,
            globalCssClassPrefix: this.globalCssClassPrefix,
            tags: this.currentSelection,
            hiddenInput: {
                name: originalInput.name,
                id: originalInput.id,
                value: originalInput.value,
            },
            placeholder: this.placeholderText
        };

        const partials: any = {
            item: this.itemTemplate
        };

        const html = Mustache.render(this.htmlTemplate, templateData, partials);

        const template = document.createElement('template');
        template.insertAdjacentHTML('afterbegin', html);

        this.tagInputContainer = template.firstChild.cloneNode(true) as HTMLElement;

        this.tagInputHiddenInput = this.tagInputContainer.querySelector('[type=hidden]') as HTMLInputElement;
        this.tagInputTextInput = this.tagInputContainer.querySelector('[type=text]') as HTMLInputElement;
        this.tagInputSuggestionDropdown = this.tagInputContainer.querySelector(`.${this.suggestionDropdownClass}`);

        template.remove();

        originalInput.insertAdjacentElement('afterend', this.tagInputContainer);
        originalInput.remove();

        if (this.allowUpperCase) {
            this.tagInputTextInput.classList.add(this.multiCaseInputClass);
        }

        this.tagInputContainer.addEventListener('click', e => {
            const element = e.target as HTMLElement;
            if (element.classList.contains(`${this.globalCssClassPrefix}-removetag`)) {
                e.stopPropagation();
                this.removeTag(element.parentElement);
            }
        }, false);

        if (this.enableSuggestions) {
            this.tagInputSuggestionDropdown.addEventListener('mousedown', async e => {
                e.preventDefault();
            });

            this.tagInputSuggestionDropdown.addEventListener('click', async e => {
                const element = e.target as HTMLElement;
                const label = element.getAttribute('data-label');
                await this.addTag(label);
            });

            this.tagInputTextInput.addEventListener('keyup', e => {
                // If the up or down arrows are hit, select the previous/next item in the suggestion list
                if (e.key === Key.UP_ARROW || e.key === Key.DOWN_ARROW) {

                    const direction = e.key === Key.DOWN_ARROW ? KeyNavDirection.DOWN : KeyNavDirection.UP;

                    const selectedItem = this.tagInputSuggestionDropdown.querySelector(`.${this.selectedSuggestionClass}`);

                    if (selectedItem) {
                        // TODO: Filter these based on class
                        // https://plainjs.com/javascript/traversing/get-siblings-of-an-element-40/

                        // An item is already selected, so select the previous/next sibling
                        let sibling = direction === KeyNavDirection.DOWN
                            ? selectedItem.nextElementSibling
                            : selectedItem.previousElementSibling;

                        // If sibling is null, we've reached the end (or beginning) of the list,
                        // so skip back around to the first (or last) item
                        if (!sibling) {
                            const allSiblings = this.tagInputSuggestionDropdown.querySelectorAll(`.${this.suggestionClass}`);
                            if (direction === KeyNavDirection.DOWN) {
                                sibling = allSiblings[0];
                            } else {
                                sibling = allSiblings[allSiblings.length - 1];
                            }
                        }

                        selectedItem.classList.remove(this.selectedSuggestionClass);
                        sibling.classList.add(this.selectedSuggestionClass);
                        this.tagInputTextInput.value = sibling.getAttribute('data-label');
                    } else if (direction === KeyNavDirection.DOWN) {
                        const firstElement = this.tagInputSuggestionDropdown.firstChild as HTMLElement;
                        firstElement.classList.add(this.selectedSuggestionClass);
                        this.tagInputTextInput.value = firstElement.getAttribute('data-label');
                    }
                } else if (this.validTagCharacters.includes(e.key)) {
                    const inputValue = this.getTextInputValue(this.allowUpperCase);

                    if (inputValue.length < this.minCharsBeforeShowingSuggestions) {
                        this.hideSuggestions();
                        return;
                    }

                    const searchValue = inputValue.toUpperCase();

                    const suggestions = this.searchTags(this.data, searchValue)
                        .map(t => {
                            const suggestionData = {
                                globalCssClassPrefix: this.globalCssClassPrefix,
                                id: t.id,
                                label: t.label
                            };

                            return Mustache.render(this.suggestionTemplate, suggestionData);
                        });

                    // TODO: show message (hit enter to add new tag) if no suggestions and new tags allowed?
                    if (!suggestions.length) {
                        this.hideSuggestions();
                        return;
                    }

                    this.tagInputSuggestionDropdown.innerHTML = suggestions
                        .slice(0, this.maxNumberOfSuggestions)
                        .join('');

                    this.showSuggestions();
                }
            });
        }

        this.tagInputTextInput.addEventListener('keydown', async e => {
            if (!this.validTagCharacters.includes(e.key)) {
                e.preventDefault();
            }

            const inputValue = this.getTextInputValue(this.allowUpperCase);

            // If enter is hit, and the input is *not* empty (if the input *is* empty,
            // we don't want to prevent the default action, which is submitting the form)
            if (e.key === Key.ENTER && inputValue !== EmptyString) {
                // Stop the form being submitted and prevent event bubbling
                e.preventDefault();
                e.stopPropagation();

                await this.addTag(inputValue);
            }

            // If backspace is hit and there's nothing in the input (if the input *isn't* empty,
            // we don't want to prevent the default action, which is deleting a character)
            if (e.key === Key.BACKSPACE && inputValue === EmptyString) {
                // Remove the last tag span before the hidden data input
                const tagElements = this.tagInputContainer.querySelectorAll(`.${this.globalCssClassPrefix}-tag`);

                if (tagElements.length) {
                    const lastTagElement = tagElements[tagElements.length - 1];
                    this.removeTag(lastTagElement);
                }
            }
        });

        this.tagInputTextInput.addEventListener('paste', async e => {
            const pastedText = e.clipboardData.getData('text');

            // Handles tags separated with spaces, commas or pipes
            const newTags = pastedText
                .replace(/\s{0,}[,| ]\s{0,}/gi, '|')
                .split('|');

            for (const tag of newTags) {
                await this.addTag(tag);
            }

            e.preventDefault();
        });

        function isTextInput(target: EventTarget) {
            const element = target as HTMLElement;
            return matches(element, 'input[type=text]');
        }

        this.tagInputTextInput.addEventListener('focus', e => {
            if (isTextInput(e.target)) {
                this.showTagInput();
            }
        });

        this.tagInputTextInput.addEventListener('blur', e => {
            if (isTextInput(e.target)) {
                this.clearTagInput();
                this.hideSuggestions();
                if (this.currentSelection.length) {
                    this.hideTagInput();
                }
            }
        });

        // Focus the text input when the control container is clicked, which triggers
        // the show/hide behaviours defined in the handlers above
        this.tagInputContainer.addEventListener('click', e => {
            this.focus();
        });

        // If the control already has some tags in it, hide the text input on load
        if (this.getHiddenInputValue() !== EmptyString) {
            this.hideTagInput();
        }
    }

    public getValue(): string {
        return this.getHiddenInputValue();
    }

    public focus(): void {
        this.tagInputTextInput.focus();
    }

    private async addTag(label: string): Promise<void> {
        // Check if the tag which was entered is already selected (we don't allow duplicates)
        const selectedTag = this.currentSelection.find(t => t.label === label);

        if (!selectedTag) {
            // Use an existing tag if one already exists with this label
            let tag = this.data.find(t => t.label === label);

            // If a tag with this label doesn't already exist, create one
            if (!tag) {
                // If this input shouldn't allow new tags, just return now
                if (!this.allowNewTags) {
                    // TODO: make the UX a bit better (red text? callback function to handle error?)
                    return;
                }

                const newItem = await this.newItemFactory(label);

                tag = {
                    id: this.getId(newItem),
                    label: this.getLabel(newItem)
                };

                // Add the tag to the internal data source, so that if it's deleted and re-added again
                // then we get it from there next time and don't create another new one
                this.data.push(tag);
            }

            this.currentSelection.push(tag);

            const tagTemplateData = {
                id: tag.id,
                label: tag.label,
                globalCssClassPrefix: this.globalCssClassPrefix
            };

            const tagHtml = Mustache.render(this.itemTemplate, tagTemplateData);

            // Insert the new tag before the hidden input
            this.tagInputHiddenInput.insertAdjacentHTML('beforebegin', tagHtml);

            this.clearTagInput();

            this.hideSuggestions();

            this.updateHiddenInput(this.currentSelection);
            this.onTagAdded(this, [tag], this.currentSelection);
            this.onTagsChanged(this, [tag], [], this.currentSelection);
        } else {
            // Highlight the duplicate tag
            const selectedTagElement = this.tagInputContainer
                .querySelector(`.${this.globalCssClassPrefix}-tag[data-label="${selectedTag.label}"]`);

            selectedTagElement.classList.add(this.warningClass);

            this.clearTagInput();

            setTimeout(() => {
                selectedTagElement.classList.remove(this.warningClass);
            }, 1500);
        }
    }

    private getTextInputValue(allowUpperCase: boolean): string {
        const value = this.tagInputTextInput.value.trim();
        return !allowUpperCase
            ? value.toLowerCase()
            : value;
    }

    private getHiddenInputValue(): string {
        return this.tagInputHiddenInput.value.trim();
    }

    private showTagInput(): void {
        if (this.placeholderText) {
            this.tagInputTextInput.setAttribute('placeholder', this.placeholderText);
        }
        // Remove the narrowing class, restoring input to its original width
        this.tagInputTextInput.classList.remove(this.narrowedInputClass);
    }

    private hideTagInput(): void {
        if (this.getTextInputValue(this.allowUpperCase) === EmptyString) {
            this.tagInputTextInput.setAttribute('placeholder', EmptyString);
            // When the tag text input loses focus, add a class which narrows it
            // to 1px wide. This is to avoid odd visual effects when the tags in
            // the control wrap onto multiple lines
            this.tagInputTextInput.classList.add(this.narrowedInputClass);
        }
    }

    private clearTagInput(): void {
        this.tagInputTextInput.value = null;
    }

    private updateHiddenInput(data: ITag[]): void {
        this.tagInputHiddenInput.value = data.map(t => t.id).join(this.tagDataSeparator);
    }

    private showSuggestions(): void {
        this.tagInputSuggestionDropdown.classList.remove(this.suggestionDropdownHiddenClass);
    }

    private hideSuggestions(): void {
        this.tagInputSuggestionDropdown.classList.add(this.suggestionDropdownHiddenClass);
    }

    private removeTag(tagElement: Element): void {
        const label = tagElement.getAttribute('data-label');
        const idx = this.currentSelection.findIndex(i => i.label === label);
        const removedTag = this.currentSelection[idx];
        this.currentSelection.splice(idx, 1);
        tagElement.remove();
        this.updateHiddenInput(this.currentSelection);
        this.onTagRemoved(this, [removedTag], this.currentSelection);
        this.onTagsChanged(this, [], [removedTag], this.currentSelection);
    }

    private searchTags(tags: ITag[], query: string): ITag[] {
        return tags
            .filter(t => !this.currentSelection.includes(t))
            .filter(t => t.label.toUpperCase().indexOf(query) > -1)
            .map(t => <[number, ITag]>[t.label.toUpperCase().indexOf(query), t])
            .sort((a, b) => {
                // If the position of the substring match differs, sort by that
                if (a[0] !== b[0]) {
                    return a[0] - b[0];
                }
                // Otherwise, sort alphabetically
                return a[1].label.localeCompare(b[1].label)
            })
            .map(f => f[1]);
    }
}
