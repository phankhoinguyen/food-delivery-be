# Hướng Dẫn Frontend - Flutter Integration với Food Delivery API

## Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Postman API Examples](#postman-api-examples)
3. [Cấu Hình Project](#cấu-hình-project)
4. [API Integration Architecture](#api-integration-architecture)
5. [API Service Implementation](#api-service-implementation)
6. [State Management](#state-management)
7. [Các Module Chính](#các-module-chính)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Best Practices](#best-practices)

## Giới Thiệu

Đây là hướng dẫn tích hợp Flutter app với Food Delivery Backend API. Document này sẽ giúp bạn hiểu cách gọi API, xử lý response, và implement các tính năng chính như orders, payments và notifications.

### Backend API Endpoints
- **Base URL**: `http://localhost:3000/api` (development)
- **Response Format**: JSON
- **HTTP Methods**: GET, POST, PUT, DELETE

## Postman API Examples

### 1. Orders API

#### 📝 Tạo Order Mới
```
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "userId": "647a1b2c8d5e9f123456789a",
  "items": [
    {
      "foodId": "647a1b2c8d5e9f123456789b",
      "quantity": 2,
      "price": 50000
    },
    {
      "foodId": "647a1b2c8d5e9f123456789c",
      "quantity": 1,
      "price": 75000
    }
  ],
  "deliveryAddress": {
    "street": "123 Nguyễn Văn A",
    "city": "Hồ Chí Minh",
    "zipCode": "70000",
    "coordinates": {
      "lat": 10.762622,
      "lng": 106.660172
    }
  },
  "paymentMethod": "zalopay",  // or "momo"
  "notes": "Gọi trước khi giao hàng"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "647a1b2c8d5e9f123456789d",
      "userId": "647a1b2c8d5e9f123456789a",
      "items": [
        {
          "foodId": "647a1b2c8d5e9f123456789b",
          "quantity": 2,
          "price": 50000
        }
      ],
      "totalAmount": 175000,
      "status": "pending",
      "deliveryAddress": {
        "street": "123 Nguyễn Văn A",
        "city": "Hồ Chí Minh",
        "zipCode": "70000"
      },
      "paymentStatus": "pending",
      "createdAt": "2024-06-03T10:30:00.000Z",
      "updatedAt": "2024-06-03T10:30:00.000Z"
    },
    "payment": {
      "success": true,
      "paymentId": "payment_123456"
    }
  }
}
```

#### 📋 Lấy Lịch Sử Orders
```
GET http://localhost:3000/api/orders?userId=647a1b2c8d5e9f123456789a&page=1&limit=10
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "647a1b2c8d5e9f123456789d",
      "userId": "647a1b2c8d5e9f123456789a",
      "items": [
        {
          "foodId": "647a1b2c8d5e9f123456789b",
          "quantity": 2,
          "price": 50000,
          "food": {
            "name": "Phở Bò",
            "image": "https://example.com/pho.jpg"
          }
        }
      ],
      "totalAmount": 100000,
      "status": "delivered",
      "paymentStatus": "paid",
      "createdAt": "2024-06-03T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 🔍 Lấy Chi Tiết Order
```
GET http://localhost:3000/api/orders/647a1b2c8d5e9f123456789d
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "647a1b2c8d5e9f123456789d",
    "userId": "647a1b2c8d5e9f123456789a",
    "items": [
      {
        "foodId": "647a1b2c8d5e9f123456789b",
        "quantity": 2,
        "price": 50000,
        "food": {
          "name": "Phở Bò",
          "description": "Phở bò truyền thống",
          "image": "https://example.com/pho.jpg",
          "restaurant": {
            "name": "Phở Hòa",
            "phone": "0901234567"
          }
        }
      }
    ],
    "totalAmount": 100000,
    "status": "preparing",
    "deliveryAddress": {
      "street": "123 Nguyễn Văn A",
      "city": "Hồ Chí Minh",
      "zipCode": "70000"
    },
    "paymentStatus": "paid",
    "estimatedDeliveryTime": "2024-06-03T11:30:00.000Z",
    "createdAt": "2024-06-03T10:30:00.000Z",
    "updatedAt": "2024-06-03T10:35:00.000Z"
  }
}
```

#### ✏️ Cập Nhật Trạng Thái Order
```
PUT http://localhost:3000/api/orders/647a1b2c8d5e9f123456789d/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "647a1b2c8d5e9f123456789d",
    "status": "confirmed",
    "updatedAt": "2024-06-03T10:40:00.000Z"
  }
}
```

### 2. Foods API

#### 🍽️ Lấy Danh Sách Món Ăn
```
GET http://localhost:3000/api/foods?category=main&page=1&limit=20&restaurantId=647a1b2c8d5e9f123456789e
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "647a1b2c8d5e9f123456789b",
      "name": "Phở Bò",
      "description": "Phở bò truyền thống với nước dùng đậm đà",
      "price": 50000,
      "category": "main",
      "image": "https://example.com/pho.jpg",
      "isActive": true,
      "restaurant": {
        "_id": "647a1b2c8d5e9f123456789e",
        "name": "Phở Hòa",
        "rating": 4.5
      },
      "createdAt": "2024-06-01T08:00:00.000Z"
    }
  ]
}
```

#### 🔍 Chi Tiết Món Ăn
```
GET http://localhost:3000/api/foods/647a1b2c8d5e9f123456789b
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "647a1b2c8d5e9f123456789b",
    "name": "Phở Bò",
    "description": "Phở bò truyền thống với nước dùng đậm đà, bánh phở tươi",
    "price": 50000,
    "category": "main",
    "image": "https://example.com/pho.jpg",
    "isActive": true,
    "ingredients": ["Thịt bò", "Bánh phở", "Hành lá", "Ngò gai"],
    "nutritionInfo": {
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 10
    },
    "restaurant": {
      "_id": "647a1b2c8d5e9f123456789e",
      "name": "Phở Hòa",
      "address": "456 Lê Văn Sỹ, Q.3, TP.HCM",
      "phone": "0901234567",
      "rating": 4.5
    },
    "reviews": [
      {
        "userId": "647a1b2c8d5e9f123456789f",
        "rating": 5,
        "comment": "Phở rất ngon!",
        "createdAt": "2024-06-02T14:30:00.000Z"
      }
    ],
    "createdAt": "2024-06-01T08:00:00.000Z"
  }
}
```

### 3. Restaurants API

#### 🏪 Lấy Danh Sách Nhà Hàng
```
GET http://localhost:3000/api/restaurants?page=1&limit=10&category=vietnamese&isActive=true
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "647a1b2c8d5e9f123456789e",
      "name": "Phở Hòa",
      "description": "Nhà hàng phở truyền thống",
      "address": {
        "street": "456 Lê Văn Sỹ",
        "city": "Hồ Chí Minh",
        "zipCode": "70000"
      },
      "phone": "0901234567",
      "email": "contact@phohoa.com",
      "image": "https://example.com/restaurant.jpg",
      "rating": 4.5,
      "isActive": true,
      "openingHours": {
        "monday": { "open": "06:00", "close": "22:00" },
        "tuesday": { "open": "06:00", "close": "22:00" }
      },
      "deliveryTime": "30-45 phút",
      "deliveryFee": 15000,
      "createdAt": "2024-05-01T08:00:00.000Z"
    }
  ]
}
```

### 4. Payments API

#### 💳 Tạo ZaloPay Payment
```
POST http://localhost:3000/api/payments/zalopay/create
Content-Type: application/json

{
  "orderId": "647a1b2c8d5e9f123456789d",
  "amount": 175000,
  "description": "Thanh toán đơn hàng #12345",
  "userId": "647a1b2c8d5e9f123456789a"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "app_trans_id": "220613_zalopay_12345",
    "order_url": "https://sbgateway.zalopay.vn/order/...",
    "zp_trans_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "amount": 175000,
    "currency": "VND"
  }
}
```

#### 💳 Tạo MomoPay Payment
```
POST http://localhost:3000/api/payments/momo/create
Content-Type: application/json

{
  "orderId": "647a1b2c8d5e9f123456789d",
  "amount": 175000,
  "orderInfo": "Thanh toán đơn hàng #12345",
  "userId": "647a1b2c8d5e9f123456789a"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "MOMO_647a1b2c8d5e9f123456789d",
    "payUrl": "https://test-payment.momo.vn/pay/...",
    "amount": 175000,
    "currency": "VND",
    "signature": "a9b8c7d6e5f4..."
  }
}
```

#### ✅ Verify Payment Status
```
GET http://localhost:3000/api/payments/{paymentId}/status
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "paymentStatus": "success",
    "transactionId": "txn_123456789",
    "provider": "zalopay"
  }
}
```

### 5. Notifications API

#### 🔔 Đăng Ký FCM Token
```
POST http://localhost:3000/api/notifications/register-token
Content-Type: application/json

{
  "userId": "647a1b2c8d5e9f123456789a",
  "fcmToken": "fGHijk123lmnop456qrstuv789wxyzABC:DEF_GHI_JKL..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "FCM token registered successfully"
}
```

#### 📨 Gửi Notification
```
POST http://localhost:3000/api/notifications/send
Content-Type: application/json

{
  "userId": "647a1b2c8d5e9f123456789a",
  "title": "Đơn hàng đã được xác nhận",
  "body": "Đơn hàng #1234 của bạn đang được chuẩn bị",
  "data": {
    "orderId": "647a1b2c8d5e9f123456789d",
    "type": "order_update"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "messageId": "0:1623456789:123456%abc123def456"
  }
}
```

### 6. Error Responses

#### ❌ Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "items": "Order items are required",
    "deliveryAddress": "Delivery address is required"
  }
}
```

#### ❌ Not Found Error (404)
```json
{
  "success": false,
  "message": "Order not found"
}
```

#### ❌ Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

### 7. Postman Collection Setup

#### Environment Variables
Tạo environment trong Postman với các variables:
```
baseUrl: http://localhost:3000/api
userId: 647a1b2c8d5e9f123456789a
orderId: 647a1b2c8d5e9f123456789d
foodId: 647a1b2c8d5e9f123456789b
restaurantId: 647a1b2c8d5e9f123456789e
```

#### Pre-request Scripts
```javascript
// Set dynamic timestamps
pm.environment.set("timestamp", new Date().toISOString());

// Generate random order ID for testing
pm.environment.set("randomOrderId", pm.variables.replaceIn('{{$randomUUID}}'));
```

#### Test Scripts
```javascript
// Check response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Check response structure
pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

// Save orderId for next requests
if (pm.response.json().data && pm.response.json().data.order) {
    pm.environment.set("orderId", pm.response.json().data.order._id);
}
```

## Cấu Hình Project

### 1. Dependencies
Thêm vào `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP client
  dio: ^5.3.2
  
  # State management
  provider: ^6.0.5
  # hoặc
  flutter_bloc: ^8.1.3
  
  # Local storage
  shared_preferences: ^2.2.0
  
  # JSON serialization
  json_annotation: ^4.8.1
  
  # Push notifications
  firebase_messaging: ^14.6.7
  firebase_core: ^2.15.1
  
  # Payment
  webview_flutter: ^4.4.2
  url_launcher: ^6.2.1
  
  # Utils
  connectivity_plus: ^4.0.2
  logger: ^2.0.1

dev_dependencies:
  # JSON code generation
  json_serializable: ^6.7.1
  build_runner: ^2.4.6
```

### 2. Project Structure
```
lib/
├── config/
│   ├── api_config.dart
│   └── app_config.dart
├── models/
│   ├── user.dart
│   ├── order.dart
│   ├── food.dart
│   ├── restaurant.dart
│   ├── payment.dart
│   └── api_response.dart
├── services/
│   ├── api_service.dart
│   ├── order_service.dart
│   ├── food_service.dart
│   ├── restaurant_service.dart
│   ├── payment_service.dart
│   └── notification_service.dart
├── providers/
│   ├── order_provider.dart
│   ├── food_provider.dart
│   └── cart_provider.dart
├── screens/
│   ├── home/
│   ├── restaurant/
│   ├── food/
│   ├── cart/
│   ├── orders/
│   └── profile/
├── widgets/
│   └── common/
└── utils/
    ├── constants.dart
    ├── helpers.dart
    └── exceptions.dart
```

## API Integration Architecture

### 1. API Configuration
```dart
// config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api';
  static const String socketUrl = 'http://localhost:3000';
  
  // Endpoints
  static const String orders = '/orders';
  static const String foods = '/foods';
  static const String restaurants = '/restaurants';
  static const String payments = '/payments';
  static const String notifications = '/notifications';
  
  // Timeouts
  static const int connectTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
}
```

### 2. Base API Service
```dart
// services/api_service.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: Duration(milliseconds: ApiConfig.connectTimeout),
      receiveTimeout: Duration(milliseconds: ApiConfig.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.add(_loggingInterceptor());
    _dio.interceptors.add(_errorInterceptor());
  }

  // Logging interceptor
  Interceptor _loggingInterceptor() {
    return LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    );
  }

  // Error interceptor
  Interceptor _errorInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) async {
        // Handle different error types
        print('API Error: ${error.message}');
        handler.next(error);
      },
    );
  }

  // HTTP Methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}
```

### 3. API Response Model
```dart
// models/api_response.dart
import 'package:json_annotation/json_annotation.dart';

part 'api_response.g.dart';

@JsonSerializable(genericArgumentFactories: true)
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final Map<String, dynamic>? errors;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.errors,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$ApiResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object Function(T value) toJsonT) =>
      _$ApiResponseToJson(this, toJsonT);
}
```

## Order Flow Implementation

### 1. Order Service
```dart
// services/order_service.dart
class OrderService {
  final ApiService _apiService = ApiService();

  // Create new order
  Future<ApiResponse<Order>> createOrder(CreateOrderRequest request) async {
    try {
      final response = await _apiService.post(
        ApiConfig.orders,
        data: request.toJson(),
      );

      return ApiResponse<Order>.fromJson(
        response.data,
        (json) => Order.fromJson(json as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // Get order history
  Future<ApiResponse<List<Order>>> getOrderHistory({
    required String userId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        ApiConfig.orders,
        queryParameters: {
          'userId': userId,
          'page': page,
          'limit': limit,
        },
      );

      return ApiResponse<List<Order>>.fromJson(
        response.data,
        (json) => (json as List)
            .map((item) => Order.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // Get order by ID
  Future<ApiResponse<Order>> getOrderById(String orderId) async {
    try {
      final response = await _apiService.get('${ApiConfig.orders}/$orderId');

      return ApiResponse<Order>.fromJson(
        response.data,
        (json) => Order.fromJson(json as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // Track order status
  Stream<Order> trackOrderStatus(String orderId) async* {
    while (true) {
      try {
        final response = await getOrderById(orderId);
        if (response.success && response.data != null) {
          yield response.data!;
          
          // Stop tracking if order is completed
          if (['delivered', 'cancelled'].contains(response.data!.status)) {
            break;
          }
        }
        
        // Wait 30 seconds before next check
        await Future.delayed(const Duration(seconds: 30));
      } catch (e) {
        // Log error and continue tracking
        print('Error tracking order: $e');
        await Future.delayed(const Duration(seconds: 30));
      }
    }
  }
}
```

### 2. Food Service
```dart
// services/food_service.dart
class FoodService {
  final ApiService _apiService = ApiService();

  // Get foods list
  Future<ApiResponse<List<Food>>> getFoods({
    String? category,
    String? restaurantId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (category != null) queryParams['category'] = category;
      if (restaurantId != null) queryParams['restaurantId'] = restaurantId;

      final response = await _apiService.get(
        ApiConfig.foods,
        queryParameters: queryParams,
      );

      return ApiResponse<List<Food>>.fromJson(
        response.data,
        (json) => (json as List)
            .map((item) => Food.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // Get food detail
  Future<ApiResponse<Food>> getFoodById(String foodId) async {
    try {
      final response = await _apiService.get('${ApiConfig.foods}/$foodId');

      return ApiResponse<Food>.fromJson(
        response.data,
        (json) => Food.fromJson(json as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
```

### 3. Restaurant Service
```dart
// services/restaurant_service.dart
class RestaurantService {
  final ApiService _apiService = ApiService();

  // Get restaurants list
  Future<ApiResponse<List<Restaurant>>> getRestaurants({
    String? category,
    bool? isActive,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (category != null) queryParams['category'] = category;
      if (isActive != null) queryParams['isActive'] = isActive;

      final response = await _apiService.get(
        ApiConfig.restaurants,
        queryParameters: queryParams,
      );

      return ApiResponse<List<Restaurant>>.fromJson(
        response.data,
        (json) => (json as List)
            .map((item) => Restaurant.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // Get restaurant detail
  Future<ApiResponse<Restaurant>> getRestaurantById(String restaurantId) async {
    try {
      final response = await _apiService.get('${ApiConfig.restaurants}/$restaurantId');

      return ApiResponse<Restaurant>.fromJson(
        response.data,
        (json) => Restaurant.fromJson(json as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
```

### 2. Order Models
```dart
// models/order.dart
@JsonSerializable()
class Order {
  final String id;
  final String userId;
  final List<OrderItem> items;
  final double totalAmount;
  final String status;
  final Address deliveryAddress;
  final String paymentStatus;
  final String? paymentId;
  final DateTime? estimatedDeliveryTime;
  final DateTime createdAt;
  final DateTime updatedAt;

  Order({
    required this.id,
    required this.userId,
    required this.items,
    required this.totalAmount,
    required this.status,
    required this.deliveryAddress,
    required this.paymentStatus,
    this.paymentId,
    this.estimatedDeliveryTime,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
  Map<String, dynamic> toJson() => _$OrderToJson(this);
}

@JsonSerializable()
class CreateOrderRequest {
  final List<OrderItem> items;
  final Address deliveryAddress;
  final String paymentMethod;
  final String? notes;

  CreateOrderRequest({
    required this.items,
    required this.deliveryAddress,
    required this.paymentMethod,
    this.notes,
  });

  factory CreateOrderRequest.fromJson(Map<String, dynamic> json) => 
      _$CreateOrderRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateOrderRequestToJson(this);
}
```

## State Management với Provider

### 1. Order Provider
```dart
// providers/order_provider.dart
class OrderProvider extends ChangeNotifier {
  final OrderService _orderService = OrderService();
  
  List<Order> _orders = [];
  bool _isLoading = false;
  String? _error;
  Order? _currentOrder;

  List<Order> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Order? get currentOrder => _currentOrder;

  // Create order
  Future<bool> createOrder(CreateOrderRequest request) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _orderService.createOrder(request);
      
      if (response.success && response.data != null) {
        _currentOrder = response.data;
        _orders.insert(0, response.data!);
        notifyListeners();
        return true;
      } else {
        _setError(response.message);
        return false;
      }
    } catch (e) {
      _setError('Tạo đơn hàng thất bại: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Load order history
  Future<void> loadOrderHistory(String userId) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _orderService.getOrderHistory(userId: userId);
      
      if (response.success && response.data != null) {
        _orders = response.data!;
        notifyListeners();
      } else {
        _setError(response.message);
      }
    } catch (e) {
      _setError('Tải lịch sử đơn hàng thất bại: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }
}
```

### 2. Food Provider
```dart
// providers/food_provider.dart
class FoodProvider extends ChangeNotifier {
  final FoodService _foodService = FoodService();
  
  List<Food> _foods = [];
  Food? _selectedFood;
  bool _isLoading = false;
  String? _error;

  List<Food> get foods => _foods;
  Food? get selectedFood => _selectedFood;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Load foods
  Future<void> loadFoods({
    String? category,
    String? restaurantId,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _foodService.getFoods(
        category: category,
        restaurantId: restaurantId,
      );
      
      if (response.success && response.data != null) {
        _foods = response.data!;
        notifyListeners();
      } else {
        _setError(response.message);
      }
    } catch (e) {
      _setError('Tải danh sách món ăn thất bại: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Get food detail
  Future<void> getFoodDetail(String foodId) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _foodService.getFoodById(foodId);
      
      if (response.success && response.data != null) {
        _selectedFood = response.data;
        notifyListeners();
      } else {
        _setError(response.message);
      }
    } catch (e) {
      _setError('Tải chi tiết món ăn thất bại: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }
}
```

### 3. Cart Provider
```dart
// providers/cart_provider.dart
class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];
  double _totalAmount = 0.0;

  List<CartItem> get items => _items;
  double get totalAmount => _totalAmount;
  int get itemCount => _items.length;

  // Add item to cart
  void addItem(String foodId, String name, double price, String image) {
    final existingIndex = _items.indexWhere((item) => item.foodId == foodId);
    
    if (existingIndex >= 0) {
      _items[existingIndex].quantity++;
    } else {
      _items.add(CartItem(
        foodId: foodId,
        name: name,
        price: price,
        image: image,
        quantity: 1,
      ));
    }
    
    _calculateTotal();
    notifyListeners();
  }

  // Remove item from cart
  void removeItem(String foodId) {
    _items.removeWhere((item) => item.foodId == foodId);
    _calculateTotal();
    notifyListeners();
  }

  // Update quantity
  void updateQuantity(String foodId, int quantity) {
    if (quantity <= 0) {
      removeItem(foodId);
      return;
    }
    
    final index = _items.indexWhere((item) => item.foodId == foodId);
    if (index >= 0) {
      _items[index].quantity = quantity;
      _calculateTotal();
      notifyListeners();
    }
  }

  // Clear cart
  void clear() {
    _items.clear();
    _totalAmount = 0.0;
    notifyListeners();
  }

  void _calculateTotal() {
    _totalAmount = _items.fold(0.0, (sum, item) => sum + (item.price * item.quantity));
  }
}

class CartItem {
  final String foodId;
  final String name;
  final double price;
  final String image;
  int quantity;

  CartItem({
    required this.foodId,
    required this.name,
    required this.price,
    required this.image,
    required this.quantity,
  });
}
```

## Payment Integration

### 1. Payment Service
```dart
// services/payment_service.dart
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  // Process ZaloPay payment
  Future<PaymentResult> processZaloPayPayment({
    required String orderId,
    required double amount,
    required String description,
    required String userId,
  }) async {
    try {
      // 1. Create payment request with ZaloPay
      final paymentResponse = await _createZaloPayPayment(
        orderId: orderId,
        amount: amount,
        description: description,
        userId: userId,
      );

      if (!paymentResponse.success) {
        throw Exception(paymentResponse.message);
      }

      // 2. Open ZaloPay payment URL
      final paymentUrl = paymentResponse.data!.orderUrl;
      await _openPaymentUrl(paymentUrl);

      // 3. Wait for callback and verify payment
      final verificationResult = await _verifyPaymentStatus(orderId);

      return PaymentResult(
        success: verificationResult.success,
        paymentId: paymentResponse.data!.appTransId,
        message: verificationResult.success 
            ? 'Thanh toán ZaloPay thành công' 
            : 'Thanh toán ZaloPay thất bại',
      );
    } catch (e) {
      return PaymentResult(
        success: false,
        message: 'Thanh toán ZaloPay thất bại: ${e.toString()}',
      );
    }
  }

  // Process MomoPay payment
  Future<PaymentResult> processMomoPayment({
    required String orderId,
    required double amount,
    required String orderInfo,
    required String userId,
  }) async {
    try {
      // 1. Create payment request with MomoPay
      final paymentResponse = await _createMomoPayment(
        orderId: orderId,
        amount: amount,
        orderInfo: orderInfo,
        userId: userId,
      );

      if (!paymentResponse.success) {
        throw Exception(paymentResponse.message);
      }

      // 2. Open MomoPay payment URL
      final paymentUrl = paymentResponse.data!.payUrl;
      await _openPaymentUrl(paymentUrl);

      // 3. Wait for callback and verify payment
      final verificationResult = await _verifyPaymentStatus(orderId);

      return PaymentResult(
        success: verificationResult.success,
        paymentId: paymentResponse.data!.orderId,
        message: verificationResult.success 
            ? 'Thanh toán MomoPay thành công' 
            : 'Thanh toán MomoPay thất bại',
      );
    } catch (e) {
      return PaymentResult(
        success: false,
        message: 'Thanh toán MomoPay thất bại: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse<ZaloPayResponse>> _createZaloPayPayment({
    required String orderId,
    required double amount,
    required String description,
    required String userId,
  }) async {
    final response = await _apiService.post(
      '${ApiConfig.payments}/zalopay/create',
      data: {
        'orderId': orderId,
        'amount': amount.toInt(),
        'description': description,
        'userId': userId,
      },
    );

    return ApiResponse<ZaloPayResponse>.fromJson(
      response.data,
      (json) => ZaloPayResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<MomoPayResponse>> _createMomoPayment({
    required String orderId,
    required double amount,
    required String orderInfo,
    required String userId,
  }) async {
    final response = await _apiService.post(
      '${ApiConfig.payments}/momo/create',
      data: {
        'orderId': orderId,
        'amount': amount.toInt(),
        'orderInfo': orderInfo,
        'userId': userId,
      },
    );

    return ApiResponse<MomoPayResponse>.fromJson(
      response.data,
      (json) => MomoPayResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<void> _openPaymentUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      throw Exception('Không thể mở URL thanh toán');
    }
  }

  Future<ApiResponse<PaymentVerification>> _verifyPaymentStatus(String orderId) async {
    final response = await _apiService.get(
      '${ApiConfig.payments}/$orderId/status',
    );

    return ApiResponse<PaymentVerification>.fromJson(
      response.data,
      (json) => PaymentVerification.fromJson(json as Map<String, dynamic>),
    );
  }
}

// Models for payment responses
class ZaloPayResponse {
  final String appTransId;
  final String orderUrl;
  final String zpTransToken;
  final int amount;
  final String currency;

  ZaloPayResponse({
    required this.appTransId,
    required this.orderUrl,
    required this.zpTransToken,
    required this.amount,
    required this.currency,
  });

  factory ZaloPayResponse.fromJson(Map<String, dynamic> json) {
    return ZaloPayResponse(
      appTransId: json['app_trans_id'],
      orderUrl: json['order_url'],
      zpTransToken: json['zp_trans_token'],
      amount: json['amount'],
      currency: json['currency'],
    );
  }
}

class MomoPayResponse {
  final String orderId;
  final String payUrl;
  final int amount;
  final String currency;
  final String signature;

  MomoPayResponse({
    required this.orderId,
    required this.payUrl,
    required this.amount,
    required this.currency,
    required this.signature,
  });

  factory MomoPayResponse.fromJson(Map<String, dynamic> json) {
    return MomoPayResponse(
      orderId: json['orderId'],
      payUrl: json['payUrl'],
      amount: json['amount'],
      currency: json['currency'],
      signature: json['signature'],
    );
  }
}

class PaymentVerification {
  final bool verified;
  final String paymentStatus;
  final String transactionId;
  final String provider;

  PaymentVerification({
    required this.verified,
    required this.paymentStatus,
    required this.transactionId,
    required this.provider,
  });

  factory PaymentVerification.fromJson(Map<String, dynamic> json) {
    return PaymentVerification(
      verified: json['verified'],
      paymentStatus: json['paymentStatus'],
      transactionId: json['transactionId'],
      provider: json['provider'],
    );
  }
}
```

## Push Notifications

### 1. Notification Service
```dart
// services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final ApiService _apiService = ApiService();

  // Initialize notifications
  Future<void> initialize() async {
    // Request permission
    await _requestPermission();
    
    // Get FCM token
    final token = await _firebaseMessaging.getToken();
    if (token != null) {
      await _sendTokenToBackend(token);
    }

    // Handle token refresh
    _firebaseMessaging.onTokenRefresh.listen(_sendTokenToBackend);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background message taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);
  }

  Future<void> _requestPermission() async {
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    print('Permission status: ${settings.authorizationStatus}');
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      await _apiService.post(
        '${ApiConfig.notifications}/register-token',
        data: {'fcmToken': token},
      );
    } catch (e) {
      print('Error sending FCM token: $e');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');
    // Show local notification or update UI
  }

  void _handleMessageTap(RemoteMessage message) {
    print('Message tapped: ${message.data}');
    // Navigate to specific screen based on message data
  }
}
```

## Error Handling

### 1. Custom Exceptions
```dart
// utils/exceptions.dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? errors;

  ApiException({
    required this.message,
    this.statusCode,
    this.errors,
  });

  factory ApiException.fromDioError(DioException error) {
    String message = 'Có lỗi xảy ra';
    int? statusCode;
    Map<String, dynamic>? errors;

    if (error.response != null) {
      statusCode = error.response!.statusCode;
      final data = error.response!.data;

      if (data is Map<String, dynamic>) {
        message = data['message'] ?? message;
        errors = data['errors'];
      }
    } else {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          message = 'Kết nối quá thời gian chờ';
          break;
        case DioExceptionType.receiveTimeout:
          message = 'Nhận dữ liệu quá thời gian chờ';
          break;
        case DioExceptionType.connectionError:
          message = 'Không thể kết nối đến server';
          break;
        default:
          message = 'Có lỗi mạng xảy ra';
      }
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
      errors: errors,
    );
  }

  @override
  String toString() => message;
}
```

## Usage Examples

### 1. Home Screen Implementation
```dart
// screens/home/home_screen.dart
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    // Load restaurants and foods
    Provider.of<FoodProvider>(context, listen: false).loadFoods();
    Provider.of<RestaurantProvider>(context, listen: false).loadRestaurants();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Food Delivery')),
      body: Consumer2<FoodProvider, RestaurantProvider>(
        builder: (context, foodProvider, restaurantProvider, child) {
          if (foodProvider.isLoading || restaurantProvider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                // Restaurant list
                Container(
                  height: 200,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: restaurantProvider.restaurants.length,
                    itemBuilder: (context, index) {
                      final restaurant = restaurantProvider.restaurants[index];
                      return RestaurantCard(restaurant: restaurant);
                    },
                  ),
                ),
                // Food list
                ListView.builder(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  itemCount: foodProvider.foods.length,
                  itemBuilder: (context, index) {
                    final food = foodProvider.foods[index];
                    return FoodCard(food: food);
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

### 2. Order Creation Flow
```dart
// screens/checkout/checkout_screen.dart
Future<void> _createOrder() async {
  final orderProvider = Provider.of<OrderProvider>(context, listen: false);
  final cartProvider = Provider.of<CartProvider>(context, listen: false);

  // Convert cart items to order items
  final orderItems = cartProvider.items.map((cartItem) => OrderItem(
    foodId: cartItem.foodId,
    quantity: cartItem.quantity,
    price: cartItem.price,
  )).toList();

  final request = CreateOrderRequest(
    userId: currentUserId, // Get from user preferences
    items: orderItems,
    deliveryAddress: selectedAddress,
    paymentMethod: selectedPaymentMethod,
    notes: notesController.text,
  );

  final success = await orderProvider.createOrder(request);

  if (success) {
    // Clear cart
    cartProvider.clear();
    
    // Navigate to order tracking
    Navigator.pushNamed(
      context, 
      '/order-tracking',
      arguments: orderProvider.currentOrder!.id,
    );
  } else {
    // Show error
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(orderProvider.error ?? 'Tạo đơn hàng thất bại')),
    );
  }
}
```

### 3. Order Tracking Screen
```dart
// screens/orders/order_tracking_screen.dart
class OrderTrackingScreen extends StatefulWidget {
  final String orderId;

  const OrderTrackingScreen({Key? key, required this.orderId}) : super(key: key);

  @override
  _OrderTrackingScreenState createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  late StreamSubscription<Order> _orderSubscription;
  Order? currentOrder;

  @override
  void initState() {
    super.initState();
    _startTracking();
  }

  void _startTracking() {
    final orderService = OrderService();
    _orderSubscription = orderService.trackOrderStatus(widget.orderId).listen(
      (order) {
        setState(() {
          currentOrder = order;
        });
      },
      onError: (error) {
        print('Error tracking order: $error');
      },
    );
  }

  @override
  void dispose() {
    _orderSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (currentOrder == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Theo dõi đơn hàng')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Đơn hàng #${currentOrder!.id.substring(0, 8)}')),
      body: Column(
        children: [
          // Order status timeline
          OrderStatusTimeline(status: currentOrder!.status),
          
          // Order details
          Expanded(
            child: ListView(
              children: [
                OrderSummaryCard(order: currentOrder!),
                DeliveryInfoCard(order: currentOrder!),
                PaymentInfoCard(order: currentOrder!),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

## Best Practices

### 1. Network Connectivity Check
```dart
// utils/network_helper.dart
import 'package:connectivity_plus/connectivity_plus.dart';

class NetworkHelper {
  static Future<bool> isConnected() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  static Stream<bool> get connectionStream {
    return Connectivity().onConnectivityChanged.map(
      (result) => result != ConnectivityResult.none,
    );
  }
}
```

### 2. Loading States
```dart
// widgets/common/loading_overlay.dart
class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;

  const LoadingOverlay({
    Key? key,
    required this.isLoading,
    required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: Colors.black54,
            child: Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
    );
  }
}
```

### 3. API Response Caching
```dart
// services/cache_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static Future<void> cacheResponse(String key, String data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, data);
    await prefs.setInt('${key}_timestamp', DateTime.now().millisecondsSinceEpoch);
  }

  static Future<String?> getCachedResponse(String key, {Duration? maxAge}) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (maxAge != null) {
      final timestamp = prefs.getInt('${key}_timestamp');
      if (timestamp != null) {
        final cachedTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
        if (DateTime.now().difference(cachedTime) > maxAge) {
          return null; // Cache expired
        }
      }
    }
    
    return prefs.getString(key);
  }
}
```

## Testing

### 1. Unit Tests cho Services
```dart
// test/services/auth_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

class MockApiService extends Mock implements ApiService {}

void main() {
  group('AuthService Tests', () {
    late AuthService authService;
    late MockApiService mockApiService;

    setUp(() {
      mockApiService = MockApiService();
      authService = AuthService();
      // Inject mock
    });

    test('should login successfully with valid credentials', () async {
      // Arrange
      final mockResponse = Response(
        data: {
          'success': true,
          'data': {
            'id': '1',
            'email': 'test@example.com',
            'access_token': 'mock_token',
          }
        },
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      );

      when(mockApiService.post(any, data: anyNamed('data')))
          .thenAnswer((_) async => mockResponse);

      // Act
      final result = await authService.login('test@example.com', 'password');

      // Assert
      expect(result.success, true);
      expect(result.data?.email, 'test@example.com');
    });
  });
}
```

---

**Tóm tắt**: Document này cung cấp hướng dẫn toàn diện để tích hợp Flutter app với Food Delivery Backend. Bạn có thể sử dụng các pattern và examples này để implement các tính năng trong app của mình. Nhớ customize theo requirements cụ thể của dự án.
