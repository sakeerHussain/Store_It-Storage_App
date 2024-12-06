"use server";
import { UploadFileProps } from "@/types/index";
import { createAdminClient } from "../appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { ID } from "node-appwrite";
import { getFileType, parseStringify } from "../utils";
import { unknown } from "zod";
import { error } from "console";
import { revalidatePath } from "next/cache";

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
  };

export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
    const { storage, databases } = await createAdminClient();

    try {
        const inputFile = InputFile.fromBuffer(file, file.name);

        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
        );

        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId,
            accountId,
            user: [],
            bucketFileId: bucketFile.$id,
        };
        const newFile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            ID.unique(),
            fileDocument,
        )
        .catch(async (unknown) => {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
            handleError(error, "FAiled to cretae file document");
        });
        revalidatePath(path);
        return parseStringify(newFile);
    } catch(error) {
        handleError(error, "Failed to upload file");
    }
};


function constructFileUrl($id: string) {
    throw new Error("Function not implemented.");
}

