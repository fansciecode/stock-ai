package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ibcmserver_init.R
import com.example.ibcmserver_init.ui.components.AsyncImage
import com.example.ibcmserver_init.ui.theme.MaterialTheme
import com.example.ibcmserver_init.ui.theme.Typography
import com.google.android.material.icons.Icons
import com.google.android.material.icons.filled.Star

data class SharedElementInfo(
    val startBounds: IntSize,
    val endBounds: IntSize,
    val startOffset: IntOffset,
    val endOffset: IntOffset
)

@Composable
fun rememberSharedElementInfo(): MutableState<SharedElementInfo?> {
    return remember { mutableStateOf(null) }
}

@Composable
fun SharedElementTransition(
    isVisible: Boolean,
    sharedElementInfo: SharedElementInfo?,
    content: @Composable () -> Unit
) {
    val density = LocalDensity.current
    
    AnimatedVisibility(
        visible = isVisible,
        enter = fadeIn() + slideIn(
            initialOffset = { IntOffset(0, it.height / 5) }
        ),
        exit = fadeOut() + slideOut(
            targetOffset = { IntOffset(0, -it.height / 5) }
        )
    ) {
        val scale by animateFloatAsState(
            targetValue = if (isVisible) 1f else 0.8f,
            label = "scale"
        )
        
        Box(
            modifier = Modifier
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                }
        ) {
            content()
        }
    }
}

@Composable
fun ProductTransitionTarget(
    isSource: Boolean,
    sharedElementInfo: MutableState<SharedElementInfo?>,
    content: @Composable () -> Unit
) {
    var size by remember { mutableStateOf(IntSize.Zero) }
    var offset by remember { mutableStateOf(IntOffset.Zero) }
    
    Box(
        modifier = Modifier
            .onGloballyPositioned { coordinates ->
                size = coordinates.size
                offset = coordinates.positionInRoot().round()
                
                if (isSource) {
                    sharedElementInfo.value = SharedElementInfo(
                        startBounds = size,
                        endBounds = IntSize.Zero,
                        startOffset = offset,
                        endOffset = IntOffset.Zero
                    )
                } else {
                    sharedElementInfo.value = sharedElementInfo.value?.copy(
                        endBounds = size,
                        endOffset = offset
                    )
                }
            }
    ) {
        content()
    }
}

@Composable
fun AnimatedProductImage(
    imageUrl: String,
    isExpanded: Boolean,
    modifier: Modifier = Modifier
) {
    val scale by animateFloatAsState(
        targetValue = if (isExpanded) 1f else 0.8f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "imageScale"
    )
    
    AsyncImage(
        model = imageUrl,
        contentDescription = null,
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            },
        contentScale = ContentScale.Crop
    )
}

@Composable
fun AnimatedPrice(
    price: String,
    isExpanded: Boolean,
    modifier: Modifier = Modifier
) {
    val textSize by animateDpAsState(
        targetValue = if (isExpanded) 24.dp else 16.dp,
        label = "textSize"
    )
    
    Text(
        text = price,
        style = MaterialTheme.typography.titleMedium.copy(
            fontSize = textSize.value.sp
        ),
        fontWeight = FontWeight.Bold,
        modifier = modifier
    )
}

@Composable
fun AnimatedRating(
    rating: Float,
    reviewCount: Int,
    isExpanded: Boolean,
    modifier: Modifier = Modifier
) {
    val iconSize by animateDpAsState(
        targetValue = if (isExpanded) 20.dp else 14.dp,
        label = "iconSize"
    )
    
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            Icons.Default.Star,
            contentDescription = null,
            modifier = Modifier.size(iconSize),
            tint = MaterialTheme.colorScheme.primary
        )
        
        AnimatedContent(
            targetState = if (isExpanded) "$rating ($reviewCount reviews)" else "$rating",
            transitionSpec = {
                fadeIn() + slideInVertically() with fadeOut() + slideOutVertically()
            }
        ) { text ->
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium
            )
        }
    }
} 