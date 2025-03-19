package com.example.ibcmserver_init.utils

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Size
import androidx.core.content.FileProvider
import com.example.ibcmserver_init.BuildConfig
import id.zelory.compressor.Compressor
import id.zelory.compressor.constraint.format
import id.zelory.compressor.constraint.quality
import id.zelory.compressor.constraint.resolution
import id.zelory.compressor.constraint.size
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.*

class MediaUtils(private val context: Context) {
    
    companion object {
        private const val MAX_IMAGE_SIZE = 1024 * 1024 // 1MB
        private const val MAX_VIDEO_SIZE = 10 * 1024 * 1024 // 10MB
        private const val THUMB_WIDTH = 320
        private const val THUMB_HEIGHT = 240
    }

    suspend fun optimizeImage(uri: Uri): Uri = withContext(Dispatchers.IO) {
        val file = createTempFile(uri)
        val compressedFile = Compressor.compress(context, file) {
            quality(80)
            format(Bitmap.CompressFormat.JPEG)
            size(MAX_IMAGE_SIZE)
            resolution(1280, 720)
        }
        FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.provider", compressedFile)
    }

    suspend fun optimizeVideo(uri: Uri): Pair<Uri, Uri> = withContext(Dispatchers.IO) {
        val inputFile = createTempFile(uri)
        val outputFile = File(context.cacheDir, "video_${UUID.randomUUID()}.mp4")
        
        // Generate thumbnail
        val thumbnail = generateVideoThumbnail(uri)
        val thumbnailFile = File(context.cacheDir, "thumb_${UUID.randomUUID()}.jpg")
        FileOutputStream(thumbnailFile).use { out ->
            thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, out)
        }

        // TODO: Implement video compression using MediaCodec or FFmpeg
        // For now, just copy the file if it's under size limit
        if (inputFile.length() <= MAX_VIDEO_SIZE) {
            inputFile.copyTo(outputFile, overwrite = true)
        } else {
            throw IllegalArgumentException("Video size exceeds limit of ${MAX_VIDEO_SIZE / 1024 / 1024}MB")
        }

        Pair(
            FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.provider", outputFile),
            FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.provider", thumbnailFile)
        )
    }

    private fun createTempFile(uri: Uri): File {
        val inputStream = context.contentResolver.openInputStream(uri)
        val file = File(context.cacheDir, "temp_${UUID.randomUUID()}")
        inputStream?.use { input ->
            FileOutputStream(file).use { output ->
                input.copyTo(output)
            }
        }
        return file
    }

    private suspend fun generateVideoThumbnail(uri: Uri): Bitmap = withContext(Dispatchers.IO) {
        val retriever = MediaMetadataRetriever()
        retriever.setDataSource(context, uri)
        
        val bitmap = retriever.getFrameAtTime(
            1000000, // Get frame at 1 second
            MediaMetadataRetriever.OPTION_CLOSEST_SYNC
        )?.let { originalBitmap ->
            val scale = minOf(
                THUMB_WIDTH.toFloat() / originalBitmap.width,
                THUMB_HEIGHT.toFloat() / originalBitmap.height
            )
            Bitmap.createScaledBitmap(
                originalBitmap,
                (originalBitmap.width * scale).toInt(),
                (originalBitmap.height * scale).toInt(),
                true
            )
        } ?: throw IllegalStateException("Could not generate thumbnail")
        
        retriever.release()
        bitmap
    }
} 