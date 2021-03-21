import { ITag, TagInput } from '../../src/lib';

import '../../src/css/standard.css';

const stringData: string[] = [
    'dog',
    'cat',
    'fish',
    'catfish',
    'dogfish',
    'bat'
];

const stringDataCased: string[] = [
    'dog',
    'CAT',
    'FISH',
    'fish',
    'CATFISH',
    'catFish',
    'catfish',
    'dogFISH',
    'bat'
];

const bigData: string[] = Array.from(Array(100).keys()).map(i => 'item-' + i);

const allContainWordData: string[] = [
    'metaprogramming',
    'abcxyz',
    'abc',
    'defxyz',
    'programming',
    'xyz',
    'abcdefxyz',
];

let lastDatabaseId = 500;

interface IExampleTagData {
    id: string;
    label: string;
}

async function createNewExampleTagDataInDatabase(label: string): Promise<IExampleTagData> {
    // Pretend that this goes off and creates a database record here
    lastDatabaseId += 100;
    return { id: lastDatabaseId.toString(), label: label };
}

const objectData: IExampleTagData[] = [
    { id: '100', label: 'dog' },
    { id: '200', label: 'cat' },
    { id: '300', label: 'fish' },
    { id: '400', label: 'catfish' },
    { id: '500', label: 'dogfish' },
    { id: '600', label: 'bat' }
];

// Set up an on-screen console for the demo
const eventConsole = document.getElementById('event-console');
const valueConsole = document.getElementById('value-console');

const logPlaceholderText = 'Add or remove a tag in one of the inputs above...';

eventConsole.innerHTML = logPlaceholderText;

function serialise(items: ITag[]) {
    return '[' + items.map(i => `{ id: '${i.id}', label: '${i.label}' }`).join(', ') + ']';
}

// Write callback data to the screen when tags are added or removed in demo inputs
function logCallbackDataToConsole<T>(id: string) {
    return (instance: TagInput<T>, added: ITag[], removed: ITag[], selected: ITag[]) => {
        const logLine = `[${id}] Added: ${serialise(added)}, Removed: ${serialise(removed)}, Selection: ${serialise(selected)}\n`;
        if (eventConsole.textContent === logPlaceholderText) {
            eventConsole.innerHTML = logLine;
        } else {
            eventConsole.append(logLine);
        }
        valueConsole.innerHTML = `[${id}] Value is now '${instance.getValue()}'`;
    };
}

export const tags0 = new TagInput<string>({
    input: document.getElementById('tags0'),
    data: stringData,
    getId: item => item,
    getLabel: item => item,
    onTagsChanged: logCallbackDataToConsole('tags0'),
    allowNewTags: false
});

export const tags1 = new TagInput<string>({
    input: document.getElementById('tags1'),
    data: stringData,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    onTagsChanged: logCallbackDataToConsole('tags1')
});

export const tags2 = new TagInput<IExampleTagData>({
    input: document.getElementById('tags2'),
    data: objectData,
    getId: item => item.id,
    getLabel: item => item.label,
    newItemFactory: async label => {
        // Pretend that this goes off and creates a new record in a database (with validation etc)
        return await createNewExampleTagDataInDatabase(label);
    },
    onTagsChanged: logCallbackDataToConsole('tags2')
});

export const tags3 = new TagInput<string>({
    input: document.getElementById('tags3'),
    data: stringData,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    onTagsChanged: logCallbackDataToConsole('tags3')
});

export const tags4 = new TagInput<string>({
    input: document.getElementById('tags4'),
    data: stringData,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    onTagsChanged: logCallbackDataToConsole('tags4'),
    enableSuggestions: false
});

export const tags5 = new TagInput<string>({
    input: document.getElementById('tags5'),
    data: stringData,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    globalCssClassPrefix: 'custom',
    htmlTemplate: document.getElementById('custom-html').innerHTML,
    itemTemplate: document.getElementById('custom-tag').innerHTML,
    suggestionTemplate: document.getElementById('custom-suggestion').innerHTML,
    onTagsChanged: logCallbackDataToConsole('tags5')
});

export const tags6 = new TagInput<string>({
    input: document.getElementById('tags6'),
    data: stringDataCased,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    onTagsChanged: logCallbackDataToConsole('tags6'),
    allowUpperCase: true
});

export const tags7 = new TagInput<string>({
    input: document.getElementById('tags7'),
    data: bigData,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    onTagsChanged: logCallbackDataToConsole('tags7'),
    maxNumberOfSuggestions: 5
});

export const tags8 = new TagInput<string>({
    input: document.getElementById('tags8'),
    data: allContainWordData,
    getId: item => item,
    getLabel: item => item,
    newItemFactory: label => Promise.resolve(label),
    onTagsChanged: logCallbackDataToConsole('tags8'),
    maxNumberOfSuggestions: 5
});
