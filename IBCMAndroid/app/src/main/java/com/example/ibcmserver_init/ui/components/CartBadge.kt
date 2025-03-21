package com.example.ibcmserver_init.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun CartBadge(
    itemCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                Icons.Default.ShoppingCart,
                contentDescription = "Shopping Cart",
                modifier = Modifier.size(24.dp)
            )
        }
        
        AnimatedVisibility(
            visible = itemCount > 0,
            enter = scaleIn() + fadeIn(),
            exit = scaleOut() + fadeOut(),
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = (-2).dp, y = 2.dp)
        ) {
            val displayCount = if (itemCount > 99) "99+" else itemCount.toString()
            
            Surface(
                color = MaterialTheme.colorScheme.error,
                shape = CircleShape,
                modifier = Modifier
                    .padding(4.dp)
                    .defaultMinSize(minWidth = 16.dp, minHeight = 16.dp)
            ) {
                Text(
                    text = displayCount,
                    color = MaterialTheme.colorScheme.onError,
                    fontSize = 10.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
fun AnimatedCartBadge(
    itemCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var previousCount by remember { mutableStateOf(itemCount) }
    var isAnimating by remember { mutableStateOf(false) }
    
    LaunchedEffect(itemCount) {
        if (itemCount > previousCount) {
            isAnimating = true
        }
        previousCount = itemCount
    }

    Box(modifier = modifier) {
        CartBadge(
            itemCount = itemCount,
            onClick = onClick,
            modifier = Modifier.graphicsLayer {
                if (isAnimating) {
                    scaleX = 1.2f
                    scaleY = 1.2f
                    isAnimating = false
                }
            }
        )
    }
} 