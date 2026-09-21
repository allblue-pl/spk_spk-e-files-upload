import abStrings from "ab-strings";
import { Module } from "spocky";
import { Messages } from "spk-messages";
import { eFields, eTexts } from "@allblue/e-libs";
import type { FilesUpload_ApiResult_List, FilesUpload_ApiResult_Upload, FilesUpload_Config } from "../$ab-data/$types/abTypes.ts";
import { LiveUpload, type FileInfo } from "spk-file-upload";
import webABApi from "web-ab-api";
import { ts0Assert } from "@allblue/ts0";

export default class FilesUpload extends Module {
    #apiUri: string;
    #category: FilesUpload_Config["categories"][number];
    #categoryName: string;
    #eFields: FilesUpload_Config;
    #id: string|null;
    #liveUpload: LiveUpload;
    #msgs: Messages;
    #onInsertFn: ((file: FileInfo) => void)|null;

    get id(): string {
        if (this.#id === null)
            throw new Error(`'id' not set.`);

        return this.#id;
    }

    constructor(msgs: Messages, categoryName: string, title: string, 
            onInsertFn: ((file: FileInfo) => void)|null = null,
            dummyImageUri: string|undefined = undefined) { super();
        this.#id = null;
        this.#onInsertFn = onInsertFn;

        if (!eFields.exists('eFilesUpload'))
            throw new Error('FilesUpload not initialized.');

        this.#eFields = eFields.get('eFilesUpload');

        if (!(categoryName in this.#eFields.categories))
            throw new Error(`Category '${categoryName}' does not exist.`);

        this.#categoryName = categoryName;
        this.#category = this.#eFields.categories[categoryName];

        this.#msgs = msgs;
        this.#apiUri = this.#eFields.apiUri;

        this.#liveUpload = new LiveUpload(title, this.#category.type, {
            onCopy: (file) => {
                navigator.clipboard.writeText(file.uri).then(() => {
                    this.#msgs.showNotification_Success(eTexts.get(
                            "FilesUpload:Notifications_Copied"));
                });
            },
            onDelete: (file) => {
                this.#files_Delete(file);
            },
            onInsert: this.#onInsertFn === null ? null : (file) => {
                ts0Assert(this.#onInsertFn !== null);                
                this.#onInsertFn(file);
            },
            onUpload: (files) => {
                this.#files_Upload(files);
            },
        }, {
            exts: this.#category.type === 'image' ? 
                '.jpg, .jpeg, .png, .gif' : this.#getExts(),
            dummyImageUri: dummyImageUri,
        });
        this.#liveUpload.showLoading();

        this.$view = this.#liveUpload;
    }

    refresh(): void {
        this.#liveUpload.showLoading();
        this.#liveUpload.deleteAllFiles();
        webABApi.json(this.#apiUri + 'list', { 
            categoryName: this.#categoryName,                     
            id: this.id,
                }, (result) => {
            this.#liveUpload.hideLoading();

            if (result.isSuccess()) {
                let data = result.getData_Success<FilesUpload_ApiResult_List>();
                let fileInfos = data.files;

                for (let fileInfo of fileInfos) {
                    this.#liveUpload.setFile({
                        id: this.#getFileId(fileInfo.fileName),
                        title: fileInfo.fileName,
                        uri: fileInfo.uri,
                        imgUri: this.#category.type === 'image' && fileInfo.uri !== null ? 
                                fileInfo.uri : eFields.get('eFilesUpload').uris.file,
                    });
                }
                // this.#liveUpload.setFile({
                //     id: fileId,
                //     title: fileId,
                //     uri: result.data.uri,
                // });
            } else
                this.#msgs.showMessage_Failure(result.message);
        });
    }

    setId(id: string): void {
        this.#id = id;
        this.refresh();
    }


    #escapeFileName(fileName: string): string {
        fileName = fileName.toLowerCase();
        fileName = abStrings.escapeLangChars(fileName);
        fileName = fileName.replace(/ /g, '-');
        fileName = abStrings.escapeToAllowedChars(fileName, 'a-zA-Z0-9._-');
        fileName = abStrings.removeDoubles(fileName, '-');

        return fileName;
    }

    #files_Delete(file: FileInfo): void {
        this.#liveUpload.deleteFile(file.id);

        webABApi.json(this.#apiUri + 'delete', { 
            categoryName: this.#categoryName,                     
            id: this.id,
            fileName: this.#category['multiple'] ? file.id : null,
                }, (result) => {
            if (result.isSuccess()) {
                
            } else {
                this.#liveUpload.setFile({
                    id: file.id,
                    title: file.title,
                    uri: file.uri,
                    imgUri: this.#category.type === 'image' ? 
                            file.uri : eFields.get('eFilesUpload').uris.file,
                });

                this.#msgs.showMessage_Failure(result.message);
            }
        });
    }

    #files_Upload(files: Array<File>): void {
        let files_Valid = [];
        let fileNames_Invalid = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if (this.#category.type === 'image') {
                if (file.type.match(/image.*/))
                    files_Valid.push(file);
                else
                    fileNames_Invalid.push(file.name);
            } else
                files_Valid.push(file);
        }

        if (fileNames_Invalid.length > 0) {
            this.#msgs.showMessage_Failure(eTexts.get(
                    'FilesUpload:Errors_WrongImageFormat', 
                    [ fileNames_Invalid.join(', ') ]));
        }
        
        for (let file of files_Valid) {
            this.#liveUpload.setFile({
                id: this.#getFileId(file.name),
                title: this.#escapeFileName(file.name),
                uri: '',
                imgUri: eFields.get('eFilesUpload').uris.loading,
            });

            webABApi.upload(`${this.#apiUri}upload`, { 
                    categoryName: this.#categoryName,                     
                    id: this.id,
                    fileName: this.#escapeFileName(file.name), 
                    }, { file: file }, (result) => {
                if (result.isSuccess()) {
                    let data = result.getData_Success<FilesUpload_ApiResult_Upload>();

                    let fileId = this.#getFileId(data.fileInfo.fileName);
                    if (fileId !== this.#getFileId(file.name))
                        this.#liveUpload.deleteFile(this.#getFileId(file.name));

                    this.#liveUpload.setFile({
                        id: this.#getFileId(fileId),
                        title: this.#escapeFileName(file.name),
                        uri: data.fileInfo.uri,
                        imgUri: this.#category.type === 'image' && 
                                data.fileInfo.uri !== null ? 
                                data.fileInfo.uri : 
                                eFields.get('eFilesUpload').uris.file,
                    });
                } else {
                    this.#liveUpload.deleteFile(this.#getFileId(file.name));

                    this.#msgs.showMessage_Failure(result.message);
                }
            });
        }
    }

    #getExts(): string {
        let extsArr = [];
        for (let ext of this.#category.exts)
            extsArr.push(`.${ext}`);

        return extsArr.join(", ");
    }

    #getFileId(fileBaseName: string): string {
        return this.#category.multiple ? this.#escapeFileName(fileBaseName) : "0";
    }

}