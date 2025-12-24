package com.doriai.app

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorView: TextView
    private val websiteUrl = "https://dori-ai.com"
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 풀스크린 모드 설정
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        
        setContentView(R.layout.activity_main)
        
        // 뷰 초기화
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        errorView = findViewById(R.id.errorView)
        
        // WebView 설정
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
        }
        
        // WebViewClient 설정 (외부 브라우저로 열리지 않도록)
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // 모든 링크를 WebView 내에서 열기
                return false
            }
            
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // 페이지 로딩 시작 시 에러 화면 숨김
                errorView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // 페이지 로딩 완료 시 프로그레스바 숨김
                progressBar.visibility = View.GONE
            }
            
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // 네트워크 오류 시 에러 화면 표시
                if (request?.isForMainFrame == true) {
                    webView.visibility = View.GONE
                    errorView.visibility = View.VISIBLE
                    progressBar.visibility = View.GONE
                }
            }
        }
        
        // WebChromeClient 설정 (프로그레스바 업데이트)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                }
            }
        }
        
        // 웹사이트 로드
        webView.loadUrl(websiteUrl)
    }
    
    // 뒤로가기 버튼 처리
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    // 앱 재개 시 WebView 복원
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
    
    // 앱 일시정지 시 WebView 일시정지
    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
    
    // 앱 종료 시 WebView 정리
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
    
    // 에러 화면 재시도 버튼 클릭
    fun retryLoad(view: View) {
        webView.visibility = View.VISIBLE
        errorView.visibility = View.GONE
        progressBar.visibility = View.VISIBLE
        webView.reload()
    }
}

