![Tests failed](https://img.shields.io/badge/tests-3%20passed%2C%205%20failed%2C%202%20skipped-critical)
|Report|Passed|Failed|Skipped|Time|
|:---|---:|---:|---:|---:|
|fixtures/dotnet-nunit-legacy.xml|3 ✅|5 ❌|2 ⚪|73ms|
## ❌ <a id="user-content-r0" href="#r0">fixtures/dotnet-nunit-legacy.xml</a>
**10** tests were completed in **73ms** with **3** passed, **5** failed and **2** skipped.
|Test suite|Passed|Failed|Skipped|Time|
|:---|---:|---:|---:|---:|
|[NUnitLegacyTests.CalculatorTests](#r0s0)|3 ✅|5 ❌|2 ⚪|73ms|
### ❌ <a id="user-content-r0s0" href="#r0s0">NUnitLegacyTests.CalculatorTests</a>
```
CalculatorTests
  ✅ Is_Even_Number(2)
  ❌ Is_Even_Number(3)
	  Expected: True
	  But was:  False
	
  ❌ Exception_In_TargetTest
	System.DivideByZeroException : Attempted to divide by zero.
  ❌ Exception_In_Test
	System.Exception : Test
  ❌ Failing_Test
	  Expected: 3
	  But was:  2
	
  ⚪ Inconclusive_Test
	couldn't run test for some reason
  ✅ Passing_Test
  ✅ Passing_Test_With_Description
  ⚪ Skipped_Test
	Skipped
  ❌ Timeout_Test
	Test exceeded Timeout value of 1ms
```