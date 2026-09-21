import ts0, { type TS0RawArray, type TS0RawObject, type TS0RawValue } from "@allblue/ts0";

export type FilesUpload_ApiResult_List = {
    files: Array<{
        fileName: string,
        uri: string,
    }>,
};

export type FilesUpload_ApiResult_Upload = {
    fileInfo: {
        fileName: string,
        uri: string,
    },
};

export type FilesUpload_FileCategory = {
    permissions: Array<string>,
    type: "file",
    exts: Array<string>,
    multiple: boolean,
    alias: string,
    media: boolean,
};

export type FilesUpload_MediaCategory = {
    permissions: Array<string>,
    type: "image",
    exts: Array<string>,
    compress: boolean,
    multiple: boolean,
    alias: string,
    sizes: {
        $default: [number,number],
        [key: string]: [number,number]
    },
};

export type FilesUpload_Config = {
    apiUri: string,
    categories: {[key: string]: {
        permissions: Array<string>,
        type: "file",
        exts: Array<string>,
        multiple: boolean,
        alias: string,
        media: boolean,
    }|{
        permissions: Array<string>,
        type: "image",
        exts: Array<string>,
        compress: boolean,
        multiple: boolean,
        alias: string,
        sizes: {
            $default: [number,number],
            [key: string]: [number,number]
        },
    }},
    uris: {
        file: string,
        loading: string,
    },
};

