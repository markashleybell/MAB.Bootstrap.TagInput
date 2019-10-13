import { ITag } from './ITag';
import { TagInput } from './TagInput';

export interface ITagInputOptions<T> {
    input: HTMLElement;
    data: T[];
    getId: (item: T) => string;
    getLabel: (item: T) => string;
    newItemFactory?: (label: string) => Promise<T>;
    enableSuggestions?: boolean;
    minCharsBeforeShowingSuggestions?: number;
    allowNewTags?: boolean;
    tagDataSeparator?: string;
    validTagCharacterKeyCodes?: number[];
    globalCssClassPrefix?: string;
    htmlTemplate?: string;
    itemTemplate?: string;
    suggestionTemplate?: string;
    onTagAdded?: (instance: TagInput<T>, added: ITag[], selected: ITag[]) => void;
    onTagRemoved?: (instance: TagInput<T>, removed: ITag[], selected: ITag[]) => void;
    onTagsChanged?: (instance: TagInput<T>, added: ITag[], removed: ITag[], selected: ITag[]) => void;
}
