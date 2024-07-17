import { Plugin, Notice, MarkdownView } from 'obsidian';
import { SettingTab } from './settings';
import { PorterStemmer } from 'natural';

// Define a setting for the plugin
interface Language {
	language: string;
}

const DEFAULT_SETTINGS: Partial<Language> = {
	language: 'en'
}

// Define a setting tab for the plugin

async function extractKeywords(content: string, language: string): Promise<string[] | null> {
	const response = await fetch('https://languages.cortical.io/rest/text/keywords?retina_name=' + language, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: content,
		redirect: "follow"
	})

	if (!response.ok) {
		new Notice('Failed to extract keywords from the content: ' + response.statusText);
		return null;
	}

	return await response.json();
}


export default class TagGeneratorPlugin extends Plugin {
	
	// Define the settings for the plugin
	settings: Language;

	// Load and save the settings
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

	
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		// Register a command to generate tags for the current note
		this.addCommand({
			id: 'generate-tags',
			name: 'Generate Tags',
			callback: async () => {
				// get the content of the current note
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView);
				const content = editor?.editor.getValue();
				if (!content) {
					new Notice('No content found in the current note.');
					return;
				}

				// extract keywords from the content
				new Notice('Extracting tags from the current note...');
				const language = this.settings.language;
				const keywords = await extractKeywords(content, language + '_general');
				
				if (!keywords) {
					new Notice('No tags found in the current note.');
					return;
				}
				
				// remove proper nouns from the keywords and duplicates
				for (let i = 0; i < keywords.length; i++) {
					if (content.toLowerCase().includes(keywords[i].toLowerCase()) && !(content.includes(keywords[i]))) {
						keywords.splice(i, 1);
						i--;
					} else {
						for (let j = i + 1; j < keywords.length; j++) {
							if (PorterStemmer.stem(keywords[i]) == PorterStemmer.stem(keywords[j])) {
								// remove the longest word
								if (keywords[i].length > keywords[j].length) {
									keywords.splice(j, 1);
								} else {
									keywords.splice(i, 1);
									i--;
									break;
								}
							}
						}
					}
				}
				

				// Update tags in current note
				const file = editor?.file;
				if (!file) {
					new Notice('No file associated with the current note.');
					return;
				} else {
					editor?.editor.replaceSelection("#" + keywords.join(' #'));
				}
			}
		});
	}
	

	onunload() {
		new Notice('TagGeneratorPlugin unloaded.');
	}
}
