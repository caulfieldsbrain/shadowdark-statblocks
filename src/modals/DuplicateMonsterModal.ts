import { App, Modal, Setting } from "obsidian";

export interface DuplicateMonsterModalOptions {
  monsterName: string;
  existingFileName: string;
  canOverwrite: boolean;
  onOverwrite?: () => Promise<void>;
  onCreateCopy: () => Promise<void>;
}

export class DuplicateMonsterModal extends Modal {
  private monsterName: string;
  private existingFileName: string;
  private canOverwrite: boolean;
  private onOverwriteCallback?: () => Promise<void>;
  private onCreateCopyCallback: () => Promise<void>;

  constructor(app: App, options: DuplicateMonsterModalOptions) {
    super(app);
    this.monsterName = options.monsterName;
    this.existingFileName = options.existingFileName;
    this.canOverwrite = options.canOverwrite;
    this.onOverwriteCallback = options.onOverwrite;
    this.onCreateCopyCallback = options.onCreateCopy;
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;

    titleEl.setText("Duplicate Monster Note");
    contentEl.empty();

    const message = document.createElement("p");
    message.textContent = this.canOverwrite
      ? `A Shadowdark monster note named "${this.existingFileName}" already exists.`
      : `A file named "${this.existingFileName}" already exists, but it is not a Shadowdark monster note.`;
    contentEl.appendChild(message);

    const subMessage = document.createElement("p");
    subMessage.textContent = this.canOverwrite
      ? "Choose whether to update the existing note, create a copy, or cancel."
      : "To avoid overwriting a non-monster note, you can create a copy or cancel.";
    contentEl.appendChild(subMessage);

    new Setting(contentEl)
      .addButton((button) => {
        if (this.canOverwrite && this.onOverwriteCallback) {
          button
            .setButtonText("Update Existing Note")
            .setCta()
            .onClick(async () => {
              await this.onOverwriteCallback?.();
              this.close();
            });
        }
      })
      .addButton((button) =>
        button
          .setButtonText("Create Copy")
          .onClick(async () => {
            await this.onCreateCopyCallback();
            this.close();
          })
      )
      .addButton((button) =>
        button
          .setButtonText("Cancel")
          .onClick(() => {
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}