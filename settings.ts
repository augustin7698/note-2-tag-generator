import TagGeneratorPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SettingTab extends PluginSettingTab {
     plugin: TagGeneratorPlugin;

     constructor(app: App, plugin: TagGeneratorPlugin) {
     super(app, plugin);
     this.plugin = plugin;
     }

     display(): void {
          let { containerEl } = this;

          containerEl.empty();

          new Setting(containerEl) // menu deroulant pour choisir la langue
               .setName("Language")
               .setDesc("Language of your notes and tags.")
               .addDropdown((dropdown) => {
                    dropdown.addOption("en", "English");
                    dropdown.addOption("fr", "French");
                    dropdown.addOption("de", "German");
                    dropdown.addOption("es", "Spanish");
                    dropdown.addOption("zh-tw", "Chinese");
                    dropdown.addOption("da", "Danish");
                    dropdown.addOption("ar", "Arabic");
                    dropdown.setValue(this.plugin.settings.language)
                         .onChange(async (value) => {
                              this.plugin.settings.language = value;
                              await this.plugin.saveSettings();
                         });
               }
          );
     }
}
