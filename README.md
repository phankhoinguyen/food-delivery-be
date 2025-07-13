# Food Delivery Backend

Backend API for a food delivery application with support for both Firebase Firestore and MongoDB databases.

## Features

- **Database Abstraction Layer**: Seamlessly switch between Firestore and MongoDB
- **Push Notifications**: Firebase Cloud Messaging (FCM) integration
- **Payment Processing**: ZaloPay and MomoPay payment gateway integration
- **Firebase Authentication**: Compatible with Firebase Auth from Flutter frontend
- **Repository Pattern**: Clean architecture for data access
- **RESTful API**: Well-structured endpoints following REST principles

## Prerequisites

- Node.js (v14 or higher)
- Firebase project with Firestore enabled
- ZaloPay and/or MomoPay merchant accounts
- MongoDB (optional, for migration)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=5000
NODE_ENV=development

# Database
DB_TYPE=firestore  # or mongodb
MONGO_URI=mongodb://localhost:27017/food_delivery

# Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Authentication
JWT_SECRET=your_jwt_secret_key

# ZaloPay Payment
ZALOPAY_APP_ID=your_zalopay_app_id
ZALOPAY_KEY1=your_zalopay_key1
ZALOPAY_KEY2=your_zalopay_key2
ZALOPAY_API_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_CALLBACK_URL=http://your-domain.com/api/payments/zalopay/callback

# MomoPay Payment
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_API_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://your-domain.com/api/payments/momo/callback
MOMO_NOTIFY_URL=http://your-domain.com/api/payments/momo/ipn

# Default Payment Provider
DEFAULT_PAYMENT_PROVIDER=zalopay  # or momo
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Payments
- `POST /api/payments` - Create a new payment
- `GET /api/payments/:paymentId` - Get payment by ID
- `GET /api/payments/user/:userId` - Get all payments for a user
- `POST /api/payments/:paymentId/refund` - Process refund for a payment
- `GET /api/payments/zalopay/callback` - Handle ZaloPay payment callback
- `POST /api/payments/zalopay/ipn` - Handle ZaloPay IPN notification
- `GET /api/payments/momo/callback` - Handle MomoPay payment callback
- `POST /api/payments/momo/ipn` - Handle MomoPay IPN notification

### Notifications
- `GET /api/notifications` - Get notifications for authenticated user
- `GET /api/notifications/unread/count` - Get unread notifications count
- `PUT /api/notifications/:notificationId/read` - Mark a notification as read
- `PUT /api/notifications/read/all` - Mark all notifications as read
- `POST /api/notifications/device-token/register` - Register a device token
- `POST /api/notifications/device-token/unregister` - Unregister a device token
- `POST /api/notifications/test` - Send a test notification (admin only)

## Payment Flow

### ZaloPay Payment Flow
1. Client requests a payment (`POST /api/payments`)
2. Server creates a payment request with ZaloPay and returns a payment URL
3. Client redirects the user to the payment URL
4. User completes payment on ZaloPay platform
5. ZaloPay redirects back to the callback URL (`/api/payments/zalopay/callback`)
6. ZaloPay sends an IPN notification to the server (`/api/payments/zalopay/ipn`)
7. Server updates the payment status and sends a push notification to the user

### MomoPay Payment Flow
1. Client requests a payment (`POST /api/payments`)
2. Server creates a payment request with MomoPay and returns a payment URL
3. Client redirects the user to the payment URL
4. User completes payment on MomoPay platform
5. MomoPay redirects back to the return URL (`/api/payments/momo/callback`)
6. MomoPay sends an IPN notification to the notify URL (`/api/payments/momo/ipn`)
7. Server updates the payment status and sends a push notification to the user

## Flutter Integration

### Setup

1. Add the following dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^0.13.5
  firebase_core: ^2.15.0
  firebase_auth: ^4.7.2
  firebase_messaging: ^14.6.5
  flutter_local_notifications: ^14.1.1
  webview_flutter: ^4.2.2
  url_launcher: ^6.1.12
```

2. Initialize Firebase in your Flutter app:

```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Initialize push notifications
  await setupPushNotifications();
  
  runApp(MyApp());
}

Future<void> setupPushNotifications() async {
  // Request permission
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  NotificationSettings settings = await messaging.requestPermission();
  
  // Initialize local notifications
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  final InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
  );
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  
  // Handle background messages
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Handle foreground messages
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    // Show notification
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;
    
    if (notification != null && android != null) {
      flutterLocalNotificationsPlugin.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
        payload: message.data['type'],
      );
    }
  });
}

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
}
```

### Authentication Service

Create an authentication service to handle Firebase authentication and JWT token:

```dart
// services/auth_service.dart
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final String _baseUrl = 'https://your-backend-url.com/api';
  String? _token;
  
  // Get the current token
  String? get token => _token;
  
  // Get the current user
  User? get currentUser => _auth.currentUser;
  
  // Sign in with Firebase and get JWT token from backend
  Future<String?> signInWithFirebase(String email, String password) async {
    try {
      // Sign in with Firebase
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email, 
        password: password
      );
      
      // Get ID token from Firebase
      String? idToken = await result.user?.getIdToken();
      
      if (idToken == null) return null;
      
      // Exchange Firebase token for backend JWT token
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'firebaseToken': idToken}),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['token'];
        return _token;
      }
      
      return null;
    } catch (e) {
      print('Sign in error: $e');
      return null;
    }
  }
  
  // Register device token for push notifications
  Future<bool> registerDeviceToken(String deviceToken) async {
    if (_token == null) return false;
    
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/notifications/device-token/register'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: json.encode({'deviceToken': deviceToken}),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Register device token error: $e');
      return false;
    }
  }
  
  // Sign out
  Future<void> signOut() async {
    await _auth.signOut();
    _token = null;
  }
}
```

### Payment Service

Create a payment service to handle payments:

```dart
// services/payment_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/material.dart';

class PaymentService {
  final String _baseUrl = 'https://your-backend-url.com/api';
  final String? _token;
  
  PaymentService(this._token);
  
  // Create a payment
  Future<Map<String, dynamic>?> createPayment({
    required String userId,
    required String orderId,
    required double amount,
    required String paymentMethod,
    required String provider, // 'momo' or 'vnpay'
    String? redirectUrl,
    String? successUrl,
    String? failureUrl,
    List<String>? deviceTokens,
  }) async {
    if (_token == null) return null;
    
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: json.encode({
          'userId': userId,
          'orderId': orderId,
          'amount': amount,
          'paymentMethod': paymentMethod,
          'paymentDetails': {
            'provider': provider,
            'redirectUrl': redirectUrl,
            'successUrl': successUrl,
            'failureUrl': failureUrl,
            'deviceTokens': deviceTokens,
          },
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      }
      
      return null;
    } catch (e) {
      print('Create payment error: $e');
      return null;
    }
  }
  
  // Open payment URL in WebView
  Future<bool> openPaymentUrl(BuildContext context, String paymentUrl) async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: Text('Payment')),
          body: WebView(
            initialUrl: paymentUrl,
            javascriptMode: JavascriptMode.unrestricted,
            navigationDelegate: (NavigationRequest request) {
              // Check if the URL is your success or failure URL
              if (request.url.contains('/payment/success') || 
                  request.url.contains('/payment/failure')) {
                Navigator.pop(context); // Close WebView
                
                // Handle success or failure
                if (request.url.contains('/payment/success')) {
                  // Show success message
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Payment successful!')),
                  );
                } else {
                  // Show failure message
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Payment failed!')),
                  );
                }
                
                return NavigationDecision.prevent;
              }
              return NavigationDecision.navigate;
            },
          ),
        ),
      ),
    );
    
    return true;
  }
  
  // Alternative: Open payment URL in external browser
  Future<bool> openPaymentUrlExternal(String paymentUrl) async {
    if (await canLaunch(paymentUrl)) {
      await launch(paymentUrl);
      return true;
    } else {
      print('Could not launch $paymentUrl');
      return false;
    }
  }
  
  // Get payment by ID
  Future<Map<String, dynamic>?> getPayment(String paymentId) async {
    if (_token == null) return null;
    
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/payments/$paymentId'),
        headers: {
          'Authorization': 'Bearer $_token',
        },
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      
      return null;
    } catch (e) {
      print('Get payment error: $e');
      return null;
    }
  }
}
```

### Usage Example

Here's how to use the payment service in your Flutter app:

```dart
// screens/checkout_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/payment_service.dart';

class CheckoutScreen extends StatefulWidget {
  final String orderId;
  final double amount;
  
  CheckoutScreen({required this.orderId, required this.amount});
  
  @override
  _CheckoutScreenState createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final AuthService _authService = AuthService();
  late PaymentService _paymentService;
  String _selectedProvider = 'momo'; // Default provider
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _paymentService = PaymentService(_authService.token);
  }
  
  Future<void> _processPayment() async {
    if (_authService.currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please login first')),
      );
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    // Get Firebase messaging token for notifications
    final messaging = FirebaseMessaging.instance;
    final deviceToken = await messaging.getToken();
    
    // Create payment
    final paymentResult = await _paymentService.createPayment(
      userId: _authService.currentUser!.uid,
      orderId: widget.orderId,
      amount: widget.amount,
      paymentMethod: _selectedProvider,
      provider: _selectedProvider,
      deviceTokens: deviceToken != null ? [deviceToken] : null,
    );
    
    setState(() {
      _isLoading = false;
    });
    
    if (paymentResult != null && paymentResult['success'] == true) {
      final paymentUrl = paymentResult['data']['paymentUrl'];
      
      // Open payment URL in WebView
      await _paymentService.openPaymentUrl(context, paymentUrl);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create payment')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Checkout')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Order Total: ${widget.amount.toStringAsFixed(0)} VND',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 20),
            Text('Select Payment Method:', style: TextStyle(fontSize: 18)),
            RadioListTile<String>(
              title: Text('MoMo'),
              value: 'momo',
              groupValue: _selectedProvider,
              onChanged: (value) {
                setState(() {
                  _selectedProvider = value!;
                });
              },
            ),
            RadioListTile<String>(
              title: Text('VNPay'),
              value: 'vnpay',
              groupValue: _selectedProvider,
              onChanged: (value) {
                setState(() {
                  _selectedProvider = value!;
                });
              },
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isLoading ? null : _processPayment,
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Pay Now'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Push Notification Handling

Register your device token when the user logs in:

```dart
// In your login screen or app initialization
Future<void> _registerDeviceToken() async {
  final messaging = FirebaseMessaging.instance;
  final deviceToken = await messaging.getToken();
  
  if (deviceToken != null) {
    final authService = AuthService();
    await authService.registerDeviceToken(deviceToken);
  }
}
```

## Database Migration

The system is designed to work with both Firestore and MongoDB. To switch between databases:

1. Update the `DB_TYPE` environment variable to either `firestore` or `mongodb`
2. Ensure the corresponding connection details are provided in the `.env` file
3. Restart the server

## Architecture

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Repositories**: Abstract database operations
- **Models**: Define data structures
- **Middlewares**: Handle cross-cutting concerns
- **Routes**: Define API endpoints
- **Utils**: Utility functions
- **Config**: Configuration files

## License

ISC 