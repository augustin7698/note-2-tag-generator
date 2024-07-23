import { Plugin, Notice, MarkdownView, moment, requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian';
import { PorterStemmer } from 'natural';


async function extractKeywords(content: string, language: string): Promise<string[] | null> {
	
	const options: RequestUrlParam = {
		url: 'https://languages.cortical.io/rest/text/keywords?retina_name=' + language,
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify(content)
	};

	let response: RequestUrlResponse;
	try {
		response = await requestUrl(options);
		return JSON.parse(response.text)
	} catch (error) {
		new Notice('Error extracting tags: ' + error);
		return null;
	}

}

async function extractTags(editor: MarkdownView, language: string, content: string) {
	// extract keywords from the content
	new Notice('Extracting tags from the current note...');
	const keywords = await extractKeywords(content, language + '_general');

	if (!keywords) {
		new Notice('No tags found for the current note.');
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
	editor.editor.replaceSelection("#" + keywords.join(' #'));
}

export default class TagGeneratorPlugin extends Plugin {
	
	async onload() {
		new Notice('Tag Generator Plugin loaded.');
		
		// Register a command to generate tags for the current note
		this.addCommand({
			id: 'generate-tags',
			name: 'Generate Tags',

			checkCallback: (checking: boolean) => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (editor) {
					const language = moment.locale();
					if (['en', 'fr', 'de', 'es', 'zh-tw', 'da', 'ar'].includes(language)) {
						const content = editor.editor.getValue();
						if (content.length > 0) {
							if (!checking) {
								extractTags(editor, language, content);
							}
							return true;
						}
					}
				}
				// No content found in the current note.
				// or
				// Language not supported, only English (en), French (fr), Deutsch (de), Spanish (es), Chinese (zh-te), Danish (da), and Arabic (ar) are supported.
				// or
				// No active note found.
				return false;
			}
		});
	}
	

	onunload() {
		new Notice('Tag Generator Plugin unloaded.');
	}
}
