# 📦 Arquitectura del SDK Embebible - SpectraView

## 🎯 El Problema: Framework Agnóstico

El SDK **NO debe ser un componente que abraze el root**. Debe ser:
- **Framework-agnóstico** (funcionar con React, Vue, Angular, Vanilla JS)
- **No invasivo** (no modificar el comportamiento de la app)
- **Ligero** (~30KB gzipped)
- **Auto-contenido** (sin dependencias externas)

---

## 🏗️ Arquitecturas Posibles

### **Opción 1: Vanilla JavaScript Puro (RECOMENDADO) ✅**

```javascript
// spectraview.min.js - Se inyecta con un simple <script> tag
(function() {
  'use strict';
  
  window.SpectraView = {
    init: function(config) {
      // Inicialización del SDK
      this.config = config;
      this.startCapture();
    },
    
    startCapture: function() {
      // Observadores y captura de eventos
      this.attachListeners();
      this.initMutationObserver();
    }
  };
  
  // Auto-inicialización si hay config global
  if (window.SPECTRAVIEW_CONFIG) {
    window.SpectraView.init(window.SPECTRAVIEW_CONFIG);
  }
})();
```

**Integración en cualquier app:**
```html
<!-- En el HTML principal -->
<script>
  window.SPECTRAVIEW_CONFIG = {
    apiKey: 'your-api-key',
    appId: 'yalo-pos'
  };
</script>
<script src="https://cdn.spectraview.com/sdk/v1.min.js" async></script>
```

**Ventajas:**
- Funciona en CUALQUIER framework
- Solo 1 línea de código para integrar
- No interfiere con el bundle de la app
- Se puede cargar async/defer

---

### **Opción 2: Web Component**

```javascript
// spectra-capture.js
class SpectraCapture extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    // Inicia captura cuando se monta
    this.initCapture();
    
    // El componente es invisible
    this.shadowRoot.innerHTML = `
      <style>:host { display: none; }</style>
    `;
  }
  
  initCapture() {
    // Observa el document completo, no el shadow DOM
    const observer = new MutationObserver(this.handleMutations);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }
}

customElements.define('spectra-capture', SpectraCapture);
```

**Integración:**
```html
<!-- React -->
<spectra-capture api-key="xxx" app-id="yalo-pos" />

<!-- Vue -->
<spectra-capture :api-key="apiKey" :app-id="appId" />

<!-- Angular -->
<spectra-capture [attr.api-key]="apiKey" [attr.app-id]="appId"></spectra-capture>
```

---

### **Opción 3: SDK Modular con Builds Específicos**

```javascript
// core/spectra-core.js - Lógica compartida
export class SpectraCore {
  constructor(config) {
    this.config = config;
    this.events = [];
  }
  
  startCapture() {
    // Lógica de captura
  }
}

// react/index.js
import { useEffect } from 'react';
import { SpectraCore } from '../core/spectra-core';

export function useSpectraView(config) {
  useEffect(() => {
    const spectra = new SpectraCore(config);
    spectra.startCapture();
    
    return () => spectra.stopCapture();
  }, []);
}

// vue/index.js
import { SpectraCore } from '../core/spectra-core';

export default {
  install(app, config) {
    const spectra = new SpectraCore(config);
    
    app.mixin({
      mounted() {
        if (this.$root === this) {
          spectra.startCapture();
        }
      }
    });
  }
}
```

---

## 🚀 Arquitectura Recomendada: Hybrid Approach

### **1. Core en Vanilla JS + Wrappers Opcionales**

```javascript
// spectraview-core.js (El corazón del SDK)
class SpectraViewCore {
  constructor(config) {
    this.config = {
      apiEndpoint: 'https://api.spectraview.com',
      apiKey: config.apiKey,
      appId: config.appId,
      userId: config.userId,
      bufferSize: config.bufferSize || 50,
      flushInterval: config.flushInterval || 10000,
      privacy: config.privacy || 'balanced',
      debug: config.debug || false
    };
    
    this.buffer = [];
    this.sessionId = this.generateSessionId();
    this.isCapturing = false;
  }
  
  init() {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    this.attachGlobalListeners();
    this.initRRWeb();
    this.startHeartbeat();
    
    if (this.config.debug) {
      console.log('[SpectraView] Initialized', this.config);
    }
  }
  
  attachGlobalListeners() {
    // Captura de errores globales
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    
    // Captura de navegación
    if (window.history) {
      const originalPushState = history.pushState;
      history.pushState = (...args) => {
        this.captureNavigation('pushState', args[2]);
        return originalPushState.apply(history, args);
      };
    }
    
    // Captura de performance
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.capturePerformance(entry);
        }
      });
      
      perfObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'largest-contentful-paint'] 
      });
    }
  }
  
  initRRWeb() {
    // Importación dinámica para no bloquear
    import('https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js')
      .then(() => {
        this.recorder = rrweb.record({
          emit: this.handleRRWebEvent.bind(this),
          
          // Configuración de privacidad
          maskAllInputs: this.config.privacy !== 'none',
          maskTextContent: false,
          maskTextSelector: '.sensitive-data',
          
          // Optimización
          sampling: {
            scroll: 150,
            media: 800,
            input: 'last'
          },
          
          // Ignorar elementos
          ignoreClass: 'spectra-ignore',
          blockClass: 'spectra-block',
          
          // Plugins
          plugins: this.getPlugins()
        });
      });
  }
}

// Exportación UMD para compatibilidad universal
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.SpectraView = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  return SpectraViewCore;
}));
```

### **2. React Wrapper**

```jsx
// @spectraview/react
import { useEffect, useRef } from 'react';
import SpectraViewCore from '@spectraview/core';

export function SpectraViewProvider({ children, config }) {
  const spectraRef = useRef(null);
  
  useEffect(() => {
    if (!spectraRef.current) {
      spectraRef.current = new SpectraViewCore(config);
      spectraRef.current.init();
    }
    
    return () => {
      if (spectraRef.current) {
        spectraRef.current.destroy();
      }
    };
  }, []);
  
  return children;
}

// Hook para acciones custom
export function useSpectraView() {
  const spectra = window.__SPECTRAVIEW_INSTANCE__;
  
  return {
    captureEvent: (name, data) => {
      spectra?.captureCustomEvent(name, data);
    },
    
    setUser: (userId) => {
      spectra?.setUser(userId);
    },
    
    addContext: (context) => {
      spectra?.addContext(context);
    }
  };
}

// Uso en React
function App() {
  return (
    <SpectraViewProvider config={{ apiKey: 'xxx', appId: 'yalo-pos' }}>
      <YourApp />
    </SpectraViewProvider>
  );
}
```

### **3. Vue Plugin**

```javascript
// @spectraview/vue
import SpectraViewCore from '@spectraview/core';

export default {
  install(app, config) {
    const spectra = new SpectraViewCore(config);
    
    // Hacer disponible globalmente
    app.config.globalProperties.$spectraview = spectra;
    app.provide('spectraview', spectra);
    
    // Iniciar cuando se monte la app
    app.mixin({
      mounted() {
        if (this.$root === this) {
          spectra.init();
        }
      },
      
      unmounted() {
        if (this.$root === this) {
          spectra.destroy();
        }
      },
      
      errorCaptured(err, instance, info) {
        spectra.captureError(err, { instance, info });
        return false;
      }
    });
  }
};

// Uso en Vue 3
import { createApp } from 'vue';
import SpectraView from '@spectraview/vue';

const app = createApp(App);
app.use(SpectraView, { apiKey: 'xxx', appId: 'yalo-pos' });
```

### **4. Angular Service**

```typescript
// @spectraview/angular
import { Injectable, OnDestroy } from '@angular/core';
import SpectraViewCore from '@spectraview/core';

@Injectable({
  providedIn: 'root'
})
export class SpectraViewService implements OnDestroy {
  private spectra: SpectraViewCore;
  
  initialize(config: SpectraConfig) {
    if (!this.spectra) {
      this.spectra = new SpectraViewCore(config);
      this.spectra.init();
    }
  }
  
  captureEvent(name: string, data?: any) {
    this.spectra?.captureCustomEvent(name, data);
  }
  
  ngOnDestroy() {
    this.spectra?.destroy();
  }
}

// Uso en Angular
export class AppComponent implements OnInit {
  constructor(private spectraView: SpectraViewService) {}
  
  ngOnInit() {
    this.spectraView.initialize({
      apiKey: 'xxx',
      appId: 'yalo-pos'
    });
  }
}
```

---

## 📦 Estrategias de Distribución

### **1. CDN (Más Simple)**
```html
<!-- Versión minificada -->
<script src="https://cdn.spectraview.com/v1/spectra.min.js"></script>
<script>
  SpectraView.init({
    apiKey: 'your-key',
    appId: 'your-app'
  });
</script>
```

### **2. NPM Packages**
```bash
# Core
npm install @spectraview/core

# Framework específico
npm install @spectraview/react
npm install @spectraview/vue
npm install @spectraview/angular
```

### **3. Auto-Inicialización**
```javascript
// El SDK busca configuración automáticamente
<script>
  window.SPECTRAVIEW = {
    apiKey: 'xxx',
    appId: 'yyy',
    autoStart: true
  };
</script>
<script src="spectra.min.js" async></script>
```

---

## 🎨 Integración Sin Modificar el Root

### **Para React (Sin Provider)**
```jsx
// En cualquier componente, incluso en App.jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Script injection method
    const script = document.createElement('script');
    script.src = 'https://cdn.spectraview.com/v1/spectra.min.js';
    script.onload = () => {
      window.SpectraView.init({
        apiKey: process.env.REACT_APP_SPECTRA_KEY,
        appId: 'yalo-pos'
      });
    };
    document.head.appendChild(script);
  }, []);
  
  return <YourApp />;
}
```

### **Para Vue (Sin Plugin)**
```vue
<script>
export default {
  mounted() {
    if (!window.SpectraView) {
      const script = document.createElement('script');
      script.src = 'https://cdn.spectraview.com/v1/spectra.min.js';
      script.onload = () => {
        window.SpectraView.init({
          apiKey: import.meta.env.VITE_SPECTRA_KEY,
          appId: 'yalo-pos'
        });
      };
      document.head.appendChild(script);
    }
  }
}
</script>
```

### **Para Angular (Sin Service)**
```typescript
export class AppComponent implements OnInit {
  ngOnInit() {
    const script = document.createElement('script');
    script.src = 'https://cdn.spectraview.com/v1/spectra.min.js';
    script.onload = () => {
      (window as any).SpectraView.init({
        apiKey: environment.spectraKey,
        appId: 'yalo-pos'
      });
    };
    document.head.appendChild(script);
  }
}
```

---

## 🔥 Build Process para el SDK

### **Webpack Config**
```javascript
// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'spectra.min.js',
    library: 'SpectraView',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: true,
        format: {
          comments: false
        }
      }
    })]
  }
};
```

### **Rollup Config (Alternativa)**
```javascript
// rollup.config.js
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/spectra.min.js',
      format: 'iife',
      name: 'SpectraView',
      plugins: [terser()]
    },
    {
      file: 'dist/spectra.esm.js',
      format: 'es'
    },
    {
      file: 'dist/spectra.cjs.js',
      format: 'cjs'
    }
  ],
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**'
    })
  ]
};
```

---

## 🎯 Ventajas del Approach Vanilla JS

1. **Universal**: Funciona en cualquier framework
2. **Ligero**: ~30KB gzipped
3. **No invasivo**: No modifica el DOM de la app
4. **Fácil integración**: 1 línea de código
5. **Async loading**: No bloquea el render
6. **Auto-contenido**: Sin dependencias
7. **Retrocompatible**: Funciona hasta en IE11 (con polyfills)

---

## 📊 Comparación de Approaches

| Approach | Pros | Cons | Tamaño | Complejidad |
|----------|------|------|---------|-------------|
| **Vanilla JS** | Universal, simple | No type-safe | ~30KB | Baja |
| **Web Component** | Estándar web | Soporte limitado | ~35KB | Media |
| **Framework Wrappers** | Type-safe, idiomático | Mantenimiento múltiple | ~40KB | Alta |
| **Iframe** | Total aislamiento | Overhead, limitaciones | ~50KB | Alta |

---

## 🚀 Recomendación Final

**Usar Vanilla JS con UMD** + Wrappers opcionales para mejor DX:

1. **Core SDK**: Vanilla JS puro, sin dependencias
2. **Distribución CDN**: Para integración rápida
3. **NPM packages**: Para mejor DX en cada framework
4. **Auto-init**: Detecta config y se inicializa solo
5. **Lazy loading**: Carga rrweb solo cuando se necesita

Esto te da lo mejor de ambos mundos: simplicidad y compatibilidad universal, con la opción de una mejor experiencia de desarrollo para cada framework.